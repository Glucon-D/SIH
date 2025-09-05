const { generateText } = require("ai");
const { getModel } = require("../config/openrouter");
const weatherService = require("../services/weatherService");

const getNudges = async (req, res) => {
  try {
    const { crop, location } = req.query;
    if (!crop || !location) {
      return res
        .status(400)
        .json({ error: "Please provide crop and location" });
    }

    // 1. Fetch weather data using shared weather service
    const weatherData = await weatherService.getWeatherForNudges(location);
    
    if (!weatherData) {
      return res
        .status(400)
        .json({ error: "Unable to fetch weather data for the provided location" });
    }

    const temp = weatherData.temp;
    const humidity = weatherData.main.humidity;
    const conditions = weatherData.weather[0].description;

    // 2. Generate nudges using OpenRouter (Gemini)
    const prompt = `
      You are an agricultural expert.
      Provide 3 short, actionable farming tips for a farmer growing ${crop}.
      Weather right now: ${conditions}, temperature: ${temp}°C, humidity: ${humidity}%.
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

    // Clean up text into array of nudges
    const nudges = nudgesText
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);

    res.json({
      crop,
      location,
      weather: {
        temperature: `${temp}°C`,
        humidity: `${humidity}%`,
        conditions,
      },
      nudges,
    });
  } catch (err) {
    console.error(
      "Nudge generation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch nudges" });
  }
};

module.exports = { getNudges };
