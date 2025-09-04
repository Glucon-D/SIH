const axios = require("axios");
const { generateText } = require("../config/aiConfig"); // OpenRouter client
const { WEATHER_API_URL, WEATHER_API_KEY } = require("../config/weatherConfig");

const getNudges = async (req, res) => {
  try {
    const { crop, location } = req.query;
    if (!crop || !location) {
      return res
        .status(400)
        .json({ error: "Please provide crop and location" });
    }

    // 1. Fetch weather data
    const weatherRes = await axios.get(WEATHER_API_URL, {
      params: { q: location, appid: WEATHER_API_KEY, units: "metric" },
    });
    const weatherData = weatherRes.data;
    const temp = weatherData.main.temp;
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

    const nudgesText = await generateText(
      "google/gemini-2.0-flash-001",
      prompt
    );

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
