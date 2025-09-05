const axios = require('axios');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const weatherService = require('./weatherService');

/**
 * In-Memory Cache System
 * Manages cached data with automatic expiration and cleanup
 */
class ContextCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000; // Maximum cache entries
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    logger.info('Context cache initialized');
  }

  /**
   * Store data in cache with TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlMinutes - Time to live in minutes
   */
  set(key, data, ttlMinutes = 60) {
    // If cache is full, remove oldest entries (simple LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlMinutes * 60 * 1000),
      lastAccessed: Date.now()
    });
    
    this.stats.sets++;
    logger.debug(`Cache SET: ${key} (TTL: ${ttlMinutes}m)`);
  }

  /**
   * Retrieve data from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    // Update last accessed time for LRU
    item.lastAccessed = Date.now();
    this.stats.hits++;
    logger.debug(`Cache HIT: ${key}`);
    return item.data;
  }

  /**
   * Remove expired entries and log cache statistics
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
      logger.info(`Cache cleanup: removed ${removedCount} expired entries`);
    }

    // Log cache statistics
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;
    logger.info(`Cache stats - Size: ${this.cache.size}, Hit rate: ${hitRate.toFixed(2)}%`);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0 };
    logger.info('Cache cleared');
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
}

// Global cache instance
const cache = new ContextCache();

/**
 * Context Service
 * Gathers and manages contextual information for AI conversations
 */
class ContextService {
  
  /**
   * Get user context from profile data
   * @param {string} userId - User ID
   * @returns {Object} User context data
   */
  async getUserContext(userId) {
    const cacheKey = `user:${userId}`;
    
    // Try to get from cache first
    let userContext = cache.get(cacheKey);
    if (userContext) {
      return userContext;
    }

    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        logger.warn(`User not found: ${userId}`);
        return null;
      }

      userContext = {
        location: user.profile?.location || 'Not specified',
        farmSize: user.profile?.farmSize || 'Not specified',
        cropTypes: user.profile?.cropTypes || [],
        experience: user.profile?.experience || 'beginner',
        language: user.preferences?.language || 'en',
        firstName: user.profile?.firstName || user.username
      };

      // Cache for 24 hours (user data doesn't change frequently)
      cache.set(cacheKey, userContext, 24 * 60);
      
      logger.debug(`User context retrieved for: ${userId}`);
      return userContext;
      
    } catch (error) {
      logger.error(`Error getting user context: ${error.message}`);
      return null;
    }
  }

  /**
   * Get weather context for a location using shared weather service
   * @param {string} location - Location name
   * @returns {Object} Weather context data
   */
  async getWeatherContext(location) {
    if (!location || location === 'Not specified') {
      return null;
    }

    try {
      // Use shared weather service instead of direct API calls
      const weatherData = await weatherService.getWeatherForContext(location);
      
      if (!weatherData) {
        logger.debug(`No weather data available for: ${location}`);
        return null;
      }

      logger.debug(`Weather context retrieved via shared service for: ${location}`);
      return weatherData;
      
    } catch (error) {
      logger.error(`Error getting weather context for ${location}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get conversation context from recent messages
   * @param {string} threadId - Thread ID
   * @param {number} limit - Number of recent messages to include
   * @returns {Object} Conversation context
   */
  async getConversationContext(threadId, limit = 10) {
    const cacheKey = `conversation:${threadId}:${limit}`;
    
    // Try to get from cache first
    let conversationContext = cache.get(cacheKey);
    if (conversationContext) {
      return conversationContext;
    }

    try {
      // Get thread information
      const thread = await Thread.findById(threadId).select('category title description metadata');
      if (!thread) {
        logger.warn(`Thread not found: ${threadId}`);
        return null;
      }

      // Get recent messages
      const messages = await Message.find({
        threadId,
        isVisible: true,
        role: { $in: ['user', 'assistant'] }
      })
      .select('role content createdOn')
      .sort({ createdOn: -1 })
      .limit(limit);

      conversationContext = {
        threadCategory: thread.category,
        threadTitle: thread.title,
        threadDescription: thread.description,
        cropType: thread.metadata?.cropType,
        season: thread.metadata?.season,
        urgencyLevel: thread.metadata?.urgencyLevel || 3,
        messageCount: messages.length,
        recentMessages: messages.reverse().map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 200), // Limit message length for context
          timestamp: msg.createdOn
        }))
      };

      // Cache for 30 minutes (conversation context changes more frequently)
      cache.set(cacheKey, conversationContext, 30);
      
      logger.debug(`Conversation context retrieved for thread: ${threadId}`);
      return conversationContext;
      
    } catch (error) {
      logger.error(`Error getting conversation context: ${error.message}`);
      return null;
    }
  }

  /**
   * Get seasonal context based on location and current date
   * @param {string} location - Location name
   * @param {Date} date - Current date
   * @returns {Object} Seasonal context
   */
  getSeasonalContext(location, date = new Date()) {
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Indian agricultural seasons (adjust based on your target region)
    let season = 'unknown';
    let activities = [];
    
    if (month >= 6 && month <= 10) {
      season = 'kharif'; // Monsoon season
      activities = ['planting rice', 'cotton cultivation', 'pest monitoring during rains'];
    } else if (month >= 11 || month <= 3) {
      season = 'rabi'; // Winter season
      activities = ['wheat cultivation', 'irrigation management', 'harvest preparation'];
    } else {
      season = 'zaid'; // Summer season
      activities = ['summer crops', 'water conservation', 'heat stress management'];
    }

    return {
      currentSeason: season,
      month: month,
      suggestedActivities: activities,
      isPlantingSeason: season === 'kharif' || season === 'rabi',
      isHarvestSeason: (season === 'rabi' && month >= 2) || (season === 'kharif' && month >= 9)
    };
  }

  /**
   * Build complete context for AI conversation
   * @param {string} userId - User ID
   * @param {string} threadId - Thread ID
   * @param {string} userMessage - User's current message
   * @returns {Object} Complete context object
   */
  async buildCompleteContext(userId, threadId, userMessage) {
    try {
      logger.info(`Building context for user: ${userId}, thread: ${threadId}`);
      
      // Gather all context data in parallel for better performance
      const [userContext, conversationContext] = await Promise.all([
        this.getUserContext(userId),
        this.getConversationContext(threadId)
      ]);

      // Get weather context if user location is available
      // The shared weather service will handle caching automatically
      let weatherContext = null;
      if (userContext?.location && userContext.location !== 'Not specified') {
        weatherContext = await this.getWeatherContext(userContext.location);
      }

      // Get seasonal context
      const seasonalContext = this.getSeasonalContext(userContext?.location);

      // Build the complete context object
      const context = {
        user: userContext,
        weather: weatherContext,
        conversation: conversationContext,
        seasonal: seasonalContext,
        currentMessage: {
          content: userMessage,
          timestamp: new Date()
        },
        metadata: {
          contextBuiltAt: new Date(),
          hasWeatherData: !!weatherContext,
          hasUserData: !!userContext,
          hasConversationData: !!conversationContext
        }
      };

      logger.info(`Context built successfully - Weather: ${!!weatherContext}, User: ${!!userContext}, Conversation: ${!!conversationContext}`);
      return context;
      
    } catch (error) {
      logger.error(`Error building complete context: ${error.message}`);
      
      // Return minimal context to ensure chat still works
      return {
        user: null,
        weather: null,
        conversation: null,
        seasonal: this.getSeasonalContext(),
        currentMessage: {
          content: userMessage,
          timestamp: new Date()
        },
        metadata: {
          contextBuiltAt: new Date(),
          hasWeatherData: false,
          hasUserData: false,
          hasConversationData: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Pre-load weather data for a user to optimize future context building
   * @param {string} userId - User ID
   * @returns {Promise<void>} Resolves when weather is pre-loaded
   */
  async preloadUserWeather(userId) {
    try {
      const userContext = await this.getUserContext(userId);
      if (userContext?.location && userContext.location !== 'Not specified') {
        await weatherService.preloadWeather(userContext.location);
        logger.debug(`Weather pre-loaded for user ${userId} at location: ${userContext.location}`);
      }
    } catch (error) {
      logger.warn(`Failed to pre-load weather for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Format context for AI prompt
   * @param {Object} context - Complete context object
   * @returns {string} Formatted context string for AI
   */
  formatContextForAI(context) {
    let contextPrompt = "FARMER CONTEXT:\n";
    
    // User context
    if (context.user) {
      contextPrompt += `Farmer: ${context.user.firstName} (${context.user.experience} level)\n`;
      contextPrompt += `Location: ${context.user.location}\n`;
      contextPrompt += `Farm Size: ${context.user.farmSize}\n`;
      if (context.user.cropTypes.length > 0) {
        contextPrompt += `Crops: ${context.user.cropTypes.join(', ')}\n`;
      }
      contextPrompt += `Language: ${context.user.language}\n`;
    }

    // Weather context
    if (context.weather) {
      contextPrompt += `\nCURRENT WEATHER:\n`;
      contextPrompt += `Location: ${context.weather.location}, ${context.weather.country}\n`;
      contextPrompt += `Temperature: ${context.weather.temperature}°C\n`;
      contextPrompt += `Conditions: ${context.weather.conditions}\n`;
      contextPrompt += `Humidity: ${context.weather.humidity}%\n`;
      contextPrompt += `Wind Speed: ${context.weather.windSpeed} m/s\n`;
    }

    // Seasonal context
    contextPrompt += `\nSEASONAL INFO:\n`;
    contextPrompt += `Current Season: ${context.seasonal.currentSeason}\n`;
    contextPrompt += `Month: ${context.seasonal.month}\n`;
    contextPrompt += `Typical Activities: ${context.seasonal.suggestedActivities.join(', ')}\n`;

    // Conversation context
    if (context.conversation) {
      contextPrompt += `\nCONVERSATION CONTEXT:\n`;
      contextPrompt += `Topic: ${context.conversation.threadCategory}\n`;
      contextPrompt += `Title: ${context.conversation.threadTitle}\n`;
      if (context.conversation.cropType) {
        contextPrompt += `Specific Crop: ${context.conversation.cropType}\n`;
      }
      if (context.conversation.urgencyLevel > 3) {
        contextPrompt += `URGENT: This is a high priority query\n`;
      }
    }

    contextPrompt += `\nINSTRUCTIONS:\n`;
    contextPrompt += `- Provide advice specific to the farmer's location and weather conditions\n`;
    contextPrompt += `- Consider the farmer's experience level in your response\n`;
    contextPrompt += `- Focus on the current season and appropriate activities\n`;
    contextPrompt += `- Be practical and actionable\n`;
    contextPrompt += `- Use simple language appropriate for the farmer's experience level\n\n`;

    return contextPrompt;
  }

  /**
   * Get cache statistics (includes both context cache and weather cache)
   */
  getCacheStats() {
    return {
      contextCache: cache.getStats(),
      weatherCache: weatherService.getCacheStats()
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    cache.clear();
    weatherService.clearCache();
  }
}

// Export singleton instance
const contextService = new ContextService();

module.exports = contextService;
