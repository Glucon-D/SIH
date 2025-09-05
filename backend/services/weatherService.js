const axios = require('axios');
const logger = require('../utils/logger');
const { WEATHER_API_URL, WEATHER_API_KEY } = require('../config/weatherConfig');

/**
 * Shared Weather Cache
 * Single cache instance used across all weather-related services
 */
class WeatherCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 500; // Smaller cache focused on weather data
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
    
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    
    logger.info('Weather cache initialized');
  }

  /**
   * Store weather data in cache
   * @param {string} location - Location name (will be normalized)
   * @param {Object} data - Weather data to cache
   * @param {number} ttlMinutes - Time to live in minutes (default: 60)
   */
  set(location, data, ttlMinutes = 60) {
    const key = this.normalizeLocation(location);
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlMinutes * 60 * 1000),
      lastAccessed: Date.now(),
      location: location // Store original location for reference
    });
    
    this.stats.sets++;
    logger.debug(`Weather cache SET: ${key} (TTL: ${ttlMinutes}m)`);
  }

  /**
   * Retrieve weather data from cache
   * @param {string} location - Location name
   * @returns {Object|null} Weather data or null if not found/expired
   */
  get(location) {
    const key = this.normalizeLocation(location);
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      logger.debug(`Weather cache MISS: ${key}`);
      return null;
    }

    // Check if expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`Weather cache EXPIRED: ${key}`);
      return null;
    }

    // Update last accessed time
    item.lastAccessed = Date.now();
    this.stats.hits++;
    logger.debug(`Weather cache HIT: ${key}`);
    return item.data;
  }

  /**
   * Normalize location string for consistent caching
   * @param {string} location - Location name
   * @returns {string} Normalized location key
   */
  normalizeLocation(location) {
    return location.toLowerCase().trim().replace(/\s+/g, '_');
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Weather cache cleanup: removed ${removedCount} expired entries`);
    }

    // Log cache statistics
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;
    logger.info(`Weather cache stats - Size: ${this.cache.size}, Hit rate: ${hitRate.toFixed(2)}%`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0 };
    logger.info('Weather cache cleared');
  }
}

// Global weather cache instance
const weatherCache = new WeatherCache();

/**
 * Centralized Weather Service
 * Single source of truth for all weather data across the application
 */
class WeatherService {
  
  /**
   * Get weather data for a location with smart caching
   * @param {string} location - Location name (city, state, country)
   * @param {Object} options - Optional parameters
   * @returns {Object|null} Weather data or null if unavailable
   */
  async getWeatherData(location, options = {}) {
    // Validate input
    if (!location || typeof location !== 'string' || location.trim() === '' || location === 'Not specified') {
      logger.warn('Invalid location provided to weather service');
      return null;
    }

    const normalizedLocation = location.trim();
    
    // Try cache first
    const cachedWeather = weatherCache.get(normalizedLocation);
    if (cachedWeather) {
      logger.debug(`Weather data served from cache for: ${normalizedLocation}`);
      return cachedWeather;
    }

    // Fetch from API
    try {
      logger.info(`Fetching weather data from API for: ${normalizedLocation}`);
      
      const response = await axios.get(WEATHER_API_URL, {
        params: {
          q: normalizedLocation,
          appid: WEATHER_API_KEY,
          units: options.units || 'metric'
        },
        timeout: options.timeout || 5000
      });

      const weatherData = response.data;
      
      // Standardize weather data format
      const standardizedWeather = this.standardizeWeatherData(weatherData);
      
      // Cache the result (1 hour TTL)
      weatherCache.set(normalizedLocation, standardizedWeather, 60);
      
      logger.info(`Weather data fetched and cached for: ${normalizedLocation}`);
      return standardizedWeather;
      
    } catch (error) {
      this.handleWeatherAPIError(error, normalizedLocation);
      return null;
    }
  }

  /**
   * Standardize weather data format for consistent usage across services
   * @param {Object} apiResponse - Raw API response from OpenWeatherMap
   * @returns {Object} Standardized weather data
   */
  standardizeWeatherData(apiResponse) {
    return {
      // Basic weather info
      temperature: Math.round(apiResponse.main.temp),
      humidity: apiResponse.main.humidity,
      conditions: apiResponse.weather[0].description,
      
      // Wind and pressure
      windSpeed: apiResponse.wind?.speed || 0,
      windDirection: apiResponse.wind?.deg || null,
      pressure: apiResponse.main.pressure,
      
      // Visibility and additional data
      visibility: apiResponse.visibility ? Math.round(apiResponse.visibility / 1000) : null, // Convert to km
      cloudiness: apiResponse.clouds?.all || 0,
      
      // Location info
      location: apiResponse.name,
      country: apiResponse.sys.country,
      coordinates: {
        lat: apiResponse.coord.lat,
        lon: apiResponse.coord.lon
      },
      
      // Timestamps
      sunrise: new Date(apiResponse.sys.sunrise * 1000),
      sunset: new Date(apiResponse.sys.sunset * 1000),
      dataTime: new Date(apiResponse.dt * 1000),
      fetchedAt: new Date(),
      
      // Additional computed fields
      feelsLike: Math.round(apiResponse.main.feels_like),
      tempMin: Math.round(apiResponse.main.temp_min),
      tempMax: Math.round(apiResponse.main.temp_max),
      
      // Raw data for advanced usage
      _raw: {
        id: apiResponse.weather[0].id,
        main: apiResponse.weather[0].main,
        icon: apiResponse.weather[0].icon
      }
    };
  }

  /**
   * Handle weather API errors with appropriate logging and classification
   * @param {Error} error - Error from API call
   * @param {string} location - Location that was requested
   */
  handleWeatherAPIError(error, location) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown API error';
      
      switch (status) {
        case 401:
          logger.error(`Weather API authentication failed - check API key`);
          break;
        case 404:
          logger.warn(`Location not found in weather API: ${location}`);
          break;
        case 429:
          logger.warn(`Weather API rate limit exceeded for: ${location}`);
          break;
        default:
          logger.error(`Weather API error (${status}): ${message} for location: ${location}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      logger.warn(`Weather API timeout for location: ${location}`);
    } else {
      logger.error(`Weather service error for ${location}: ${error.message}`);
    }
  }

  /**
   * Get weather data formatted for nudges (backward compatibility)
   * @param {string} location - Location name
   * @returns {Object|null} Weather data in nudges format
   */
  async getWeatherForNudges(location) {
    const weatherData = await this.getWeatherData(location);
    if (!weatherData) return null;

    // Return format expected by nudges controller
    return {
      temperature: `${weatherData.temperature}°C`,
      humidity: `${weatherData.humidity}%`,
      conditions: weatherData.conditions,
      temp: weatherData.temperature, // For backward compatibility
      main: {
        temp: weatherData.temperature,
        humidity: weatherData.humidity
      },
      weather: [{
        description: weatherData.conditions
      }]
    };
  }

  /**
   * Get weather data formatted for context service
   * @param {string} location - Location name
   * @returns {Object|null} Weather data in context format
   */
  async getWeatherForContext(location) {
    const weatherData = await this.getWeatherData(location);
    if (!weatherData) return null;

    // Return format expected by context service
    return {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      conditions: weatherData.conditions,
      windSpeed: weatherData.windSpeed,
      pressure: weatherData.pressure,
      visibility: weatherData.visibility,
      location: weatherData.location,
      country: weatherData.country
    };
  }

  /**
   * Pre-load weather data for a user's location
   * @param {string} location - User's location
   * @returns {Promise<void>} Resolves when weather is cached
   */
  async preloadWeather(location) {
    if (!location || location === 'Not specified') return;
    
    try {
      await this.getWeatherData(location);
      logger.debug(`Weather pre-loaded for: ${location}`);
    } catch (error) {
      logger.warn(`Failed to pre-load weather for: ${location}`);
    }
  }

  /**
   * Bulk pre-load weather for multiple locations
   * @param {string[]} locations - Array of location names
   * @returns {Promise<void>} Resolves when all locations are processed
   */
  async preloadMultipleWeather(locations) {
    const validLocations = locations.filter(loc => loc && loc !== 'Not specified');
    
    if (validLocations.length === 0) return;
    
    logger.info(`Pre-loading weather for ${validLocations.length} locations`);
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < validLocations.length; i += batchSize) {
      const batch = validLocations.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(location => this.preloadWeather(location))
      );
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < validLocations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return weatherCache.getStats();
  }

  /**
   * Clear weather cache
   */
  clearCache() {
    weatherCache.clear();
  }
}

// Export singleton instance
const weatherService = new WeatherService();

module.exports = weatherService;