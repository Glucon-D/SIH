const { createOpenRouter } = require('@openrouter/ai-sdk-provider');
const logger = require('../utils/logger');

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model configuration
const MODELS = {
  'google/gemini-2.5-flash-lite': {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    description: 'Lightweight and fast Gemini model optimized for quick responses and cost-effectiveness',
    contextLength: 1000000,
    inputCost: 0.05,
    outputCost: 0.15,
    capabilities: ['text', 'vision', 'reasoning', 'code', 'multimodal'],
    recommended: true,
  }
};

// Default model
const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite';

// Get model instance
const getModel = (modelId = DEFAULT_MODEL) => {
  try {
    if (!MODELS[modelId]) {
      logger.warn(`Model ${modelId} not found, using default model ${DEFAULT_MODEL}`);
      modelId = DEFAULT_MODEL;
    }
    
    return openrouter(modelId);
  } catch (error) {
    logger.error(`Error creating model instance: ${error.message}`);
    throw new Error('Failed to initialize AI model');
  }
};

// Validate OpenRouter configuration
const validateConfig = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required');
  }
  
  logger.info('OpenRouter configuration validated successfully');
};

module.exports = {
  openrouter,
  getModel,
  validateConfig,
  MODELS,
  DEFAULT_MODEL
};
