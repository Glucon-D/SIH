const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

if (!process.env.WEATHER_API_KEY) {
  throw new Error("WEATHER_API_KEY is missing in .env");
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

module.exports = { WEATHER_API_URL, WEATHER_API_KEY };
