const axios = require("axios");
const { generateText } = require("ai");
const { getModel } = require("../config/openrouter");
const { WEATHER_API_URL, WEATHER_API_KEY } = require("../config/weatherConfig");

const getNudges = async (req, res) => {
  try {
    console.log("🌾 Nudges request received:", req.query);

    const { crop, location } = req.query;
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

    // 2. Generate nudges using OpenRouter (Gemini)
    const prompt = `
      You are an agricultural expert.
      Provide 3 short, actionable farming tips for a farmer growing ${crop}.
      Weather right now: ${conditions}, temperature: ${temp}°C, humidity: ${humidity}%, date: ${date.toDateString()}.
      Important:
      - Give the tips directly, without any introductory sentence.
      - Number them 1, 2, 3 only.
      - Keep them simple and relevant only to ${crop}.
      - Do NOT include phrases like "Okay, here are..." or "Here are 3 tips".
    `;

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
