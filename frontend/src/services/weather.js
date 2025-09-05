import { nudgesService } from "./nudges";

const WEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const WEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";

// Local "DB" keys (fixed names as per requirement)
const WEATHER_CITY_KEY = "weather_city";
const WEATHER_CACHE_KEY = "weather_cache";

// Helpers
const todayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // local date key
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Failed saving weather cache", e);
  }
};

const saveCity = (city) => localStorage.setItem(WEATHER_CITY_KEY, city);
const getSavedCity = () => localStorage.getItem(WEATHER_CITY_KEY) || "";

const iconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

// From 5-day/3-hour forecast -> group into days
const processForecast = (forecastJson) => {
  const byDate = new Map();
  (forecastJson?.list || []).forEach((entry) => {
    const date = new Date(entry.dt * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    let bucket = byDate.get(dateKey);
    if (!bucket) {
      bucket = {
        temps: [],
        humidities: [],
        winds: [],
        icons: [],
        mains: [],
        labels: "",
      };
      byDate.set(dateKey, bucket);
    }
    bucket.temps.push(entry.main?.temp);
    bucket.humidities.push(entry.main?.humidity);
    bucket.winds.push(entry.wind?.speed);
    const w = (entry.weather && entry.weather[0]) || {};
    if (w.icon) bucket.icons.push(w.icon);
    if (w.main) bucket.mains.push(w.main);
  });

  const days = Array.from(byDate.entries())
    .slice(0, 7)
    .map(([dateKey, b]) => {
      const date = new Date(dateKey);
      const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
      const dayNum = date.getDate();
      const month = date.toLocaleDateString(undefined, { month: "short" });
      const avg = (arr) => {
        const nums = arr.filter((x) => typeof x === "number");
        return nums.length ? nums.reduce((a, c) => a + c, 0) / nums.length : 0;
      };
      const icon = b.icons[0] || "01d";
      const main = b.mains[0] || "";
      return {
        dateKey,
        label: `${weekday} ${dayNum} ${month}`,
        icon,
        iconUrl: iconUrl(icon),
        main,
        min: Math.round(
          Math.min(...b.temps.filter((n) => typeof n === "number"))
        ),
        max: Math.round(
          Math.max(...b.temps.filter((n) => typeof n === "number"))
        ),
        humidity: Math.round(avg(b.humidities)),
        wind: Math.round(avg(b.winds)),
      };
    });

  return {
    city: forecastJson?.city?.name || "",
    country: forecastJson?.city?.country || "",
    cnt: days.length,
    today: days[0] || null,
    days,
  };
};

// Build URLs for current weather and 5-day/3-hour forecast
const buildCurrentUrl = (city) => {
  const params = new URLSearchParams({ q: city, units: "metric" });
  if (API_KEY) params.append("appid", API_KEY);
  return `${WEATHER_CURRENT_URL}?${params.toString()}`;
};

const buildForecastUrl = (city) => {
  const params = new URLSearchParams({ q: city, units: "metric" });
  if (API_KEY) params.append("appid", API_KEY);
  return `${WEATHER_FORECAST_URL}?${params.toString()}`;
};

export const weatherService = {
  iconUrl,
  getSavedCity,
  saveCity,

  getDefaultCity: async () => {
    // Try saved city first
    const saved = getSavedCity();
    if (saved) return saved;

    try {
      const ipLoc = await nudgesService.getLocationFromIP();
      if (ipLoc?.city) {
        saveCity(ipLoc.city);
        return ipLoc.city;
      }
    } catch {}
    // Fallback
    const fallback = "New Delhi";
    saveCity(fallback);
    return fallback;
  },

  // Returns { ui, raw, dateKey, city }
  getForecast: async (desiredCity) => {
    const city = desiredCity || (await weatherService.getDefaultCity());
    const date = todayKey();

    const cache = readCache();
    const entry = cache[city];

    if (entry && entry.dateKey === date && entry.ui && entry.raw) {
      return { ...entry, city };
    }

    // If API key missing, avoid fetch to prevent noisy errors
    if (!API_KEY) {
      console.warn(
        "VITE_OPENWEATHER_API_KEY is not set. Weather widget will show placeholder."
      );
      const ui = { city, country: "", cnt: 0, today: null, days: [] };
      const raw = null;
      const payload = { ui, raw, dateKey: date, city };
      cache[city] = payload;
      writeCache(cache);
      return payload;
    }

    // Fetch current and forecast
    const [curRes, forecastRes] = await Promise.all([
      fetch(buildCurrentUrl(city)),
      fetch(buildForecastUrl(city)),
    ]);

    if (!curRes.ok) throw new Error(`Weather API (current) ${curRes.status}`);
    if (!forecastRes.ok)
      throw new Error(`Weather API (forecast) ${forecastRes.status}`);

    const current = await curRes.json();
    const forecast = await forecastRes.json();

    const ui = processForecast(forecast);
    // Fill today icon with current icon if present
    const curIcon = current?.weather?.[0]?.icon;
    if (curIcon && ui.today) {
      ui.today.icon = curIcon;
      ui.today.iconUrl = iconUrl(curIcon);
      ui.today.main = current?.weather?.[0]?.main || ui.today.main;
    }

    const raw = { current, forecast };
    const payload = { ui, raw, dateKey: date, city };
    cache[city] = payload;
    writeCache(cache);
    saveCity(city);

    return payload;
  },

  // Force refresh regardless of cache
  refreshForecast: async (city) => {
    const targetCity =
      city || getSavedCity() || (await weatherService.getDefaultCity());
    const date = todayKey();
    if (!API_KEY) return weatherService.getForecast(targetCity);
    const [curRes, forecastRes] = await Promise.all([
      fetch(buildCurrentUrl(targetCity)),
      fetch(buildForecastUrl(targetCity)),
    ]);
    if (!curRes.ok) throw new Error(`Weather API (current) ${curRes.status}`);
    if (!forecastRes.ok)
      throw new Error(`Weather API (forecast) ${forecastRes.status}`);
    const current = await curRes.json();
    const forecast = await forecastRes.json();
    const ui = processForecast(forecast);
    const curIcon = current?.weather?.[0]?.icon;
    if (curIcon && ui.today) {
      ui.today.icon = curIcon;
      ui.today.iconUrl = iconUrl(curIcon);
      ui.today.main = current?.weather?.[0]?.main || ui.today.main;
    }
    const cache = readCache();
    const payload = {
      ui,
      raw: { current, forecast },
      dateKey: date,
      city: targetCity,
    };
    cache[targetCity] = payload;
    writeCache(cache);
    saveCity(targetCity);
    return payload;
  },
};
