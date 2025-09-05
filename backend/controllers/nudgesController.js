const axios = require("axios");
const { generateText } = require("ai");
const { getModel } = require("../config/openrouter");
const { WEATHER_API_URL, WEATHER_API_KEY } = require("../config/weatherConfig");

// Helper function to build personalized nudges prompt
const buildPersonalizedNudgesPrompt = (crop, weather, user, language = null) => {
  const { temp, humidity, conditions, date } = weather;
  const profile = user?.profile || {};
  const preferences = user?.preferences || {};

  // Language mapping
  const languageInstructions = {
    en: "Respond in English.",
    hi: "Respond in Hindi (हिंदी). Use Devanagari script and include English terms in parentheses for technical words.",
    ml: "Respond in Malayalam (മലയാളം). Use Malayalam script and include English terms in parentheses for technical words."
  };

  // Use provided language parameter, fallback to user preference, then default to English
  const userLanguage = language || preferences.language || 'en';
  const languageInstruction = languageInstructions[userLanguage] || languageInstructions.en;

  let prompt = `You are a friendly farming helper talking to a local farmer. Use VERY SIMPLE language that any farmer can understand, even if they cannot read well.

🎯 TASK: Give 3 easy farming tips for ${crop} that farmers can do today.
🌐 LANGUAGE: ${languageInstruction}

🌤️ TODAY'S WEATHER:
- Weather: ${conditions}
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Date: ${date}

IMPORTANT: Use simple words like talking to your neighbor. No big scientific words. No complicated measurements.`;

  // Add user-specific context
  if (profile.experience) {
    const experienceContext = {
      beginner: "\n👤 FARMER: New to farming - Use very simple words and explain everything step by step.",
      intermediate: "\n👤 FARMER: Has some farming experience - Use simple language but can understand basic farming terms.",
      advanced: "\n👤 FARMER: Experienced farmer - Still use simple language but can mention farming techniques."
    };
    prompt += experienceContext[profile.experience];
  }

  if (profile.location) {
    prompt += `\n📍 LOCATION: ${profile.location} - Consider local climate, soil conditions, and regional farming practices.`;
  }

  if (profile.farmSize) {
    prompt += `\n🏞️ FARM SIZE: ${profile.farmSize} - Scale recommendations appropriately for this farm size.`;
  }

  if (profile.cropTypes && profile.cropTypes.length > 1) {
    const otherCrops = profile.cropTypes.filter(c => c.toLowerCase() !== crop.toLowerCase());
    if (otherCrops.length > 0) {
      prompt += `\n🌱 OTHER CROPS: Also grows ${otherCrops.join(', ')} - Consider crop rotation and intercropping opportunities.`;
    }
  }

  prompt += `\n\n📋 REQUIREMENTS:
- Provide exactly 3 simple tips, numbered 1, 2, 3
- Use VERY SIMPLE language that any farmer can understand
- NO scientific names or technical terms
- NO complex measurements - use simple terms like "handful", "cup", "bucket"
- Make each tip something farmers can do TODAY with basic tools
- Focus on practical, low-cost solutions for ${crop}
- NO introductory phrases like "Here are tips" or "Okay"
- Keep each tip short and easy to remember

✨ SIMPLE LANGUAGE GUIDELINES:
- Use **bold text** only for the main action (what to do)
- Avoid scientific names - use common local names
- Use simple measurements: "2 spoons per bucket of water" instead of "2ml per liter"
- Use everyday words: "plant disease" instead of "fungal pathogen"
- Make it conversational like talking to a neighbor farmer
- Example: "**Check your plants daily** for yellow or brown spots on leaves"
- For non-English responses: Use simple, everyday words in that language`;

  return prompt;
};

const getNudges = async (req, res) => {
  try {
    console.log("🌾 Nudges request received:", req.query);
    console.log("👤 User authenticated:", !!req.user);

    let { crop, location, language = 'en' } = req.query;

    // If no location provided but user is authenticated and has stored location, use it
    if (!location && req.user?.profile?.location) {
      location = req.user.profile.location;
      console.log("📍 Using stored user location:", location);
    }

    if (!crop || !location) {
      console.log("❌ Missing crop or location");
      return res
        .status(400)
        .json({ error: "Please provide crop and location" });
    }

    console.log("📍 Processing request for crop:", crop, "location:", location);

    // 1. Fetch weather data
    let weatherParams;

    // Check if location is coordinates (lat,lon) or city name
    if (location.includes(",")) {
      const [lat, lon] = location.split(",");
      weatherParams = {
        lat: lat.trim(),
        lon: lon.trim(),
        appid: WEATHER_API_KEY,
        units: "metric",
      };
    } else {
      weatherParams = { q: location, appid: WEATHER_API_KEY, units: "metric" };
    }

    console.log("🌤️ Weather API request params:", weatherParams);

    const weatherRes = await axios.get(WEATHER_API_URL, {
      params: weatherParams,
    });
    const weatherData = weatherRes.data;

    console.log("🌤️ Weather API response:", weatherData);
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const conditions = weatherData.weather[0].description;
    const date = new Date();

    // 2. Generate personalized nudges using user profile data
    const weatherContext = {
      temp,
      humidity,
      conditions,
      date: date.toDateString()
    };

    const prompt = buildPersonalizedNudgesPrompt(crop, weatherContext, req.user, language);

    // Log personalized context for debugging
    console.log("🎯 Personalized nudges context:", {
      crop,
      hasUser: !!req.user,
      experience: req.user?.profile?.experience,
      location: req.user?.profile?.location,
      farmSize: req.user?.profile?.farmSize,
      cropTypes: req.user?.profile?.cropTypes?.length || 0
    });

    // Get AI model with proper headers (uses centralized default model)
    const model = getModel();

    // Generate text using the SDK
    const result = await generateText({
      model: model,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 300,
    });

    const nudgesText = result.text;
    console.log("🤖 AI generated text:", nudgesText);

    // Clean up text into array of nudges
    const nudges = nudgesText
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);

    console.log("📝 Processed nudges:", nudges);

    const responseData = {
      crop,
      location,
      weather: {
        temperature: `${temp}°C`,
        humidity: `${humidity}%`,
        conditions,
      },
      nudges,
    };

    console.log("✅ Sending response:", responseData);
    res.json(responseData);
  } catch (err) {
    console.error(
      "Nudge generation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch nudges" });
  }
};

module.exports = { getNudges };
