const express = require('express');
const { body, param, query } = require('express-validator');
const threadController = require('../controllers/threadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createThreadValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Thread title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thread description cannot exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn([
      'pest_management',
      'disease_control',
      'fertilizer_advice',
      'weather_guidance',
      'crop_planning',
      'market_information',
      'government_schemes',
      'general_query',
      'other'
    ])
    .withMessage('Invalid thread category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid thread priority'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const updateThreadValidation = [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid thread ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Thread title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thread description cannot exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'resolved', 'archived'])
    .withMessage('Invalid thread status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid thread priority')
];

const threadIdValidation = [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid thread ID')
];

const feedbackValidation = [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid thread ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback comment cannot exceed 500 characters'),
  
  body('helpful')
    .optional()
    .isBoolean()
    .withMessage('Helpful must be a boolean')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['active', 'resolved', 'archived'])
    .withMessage('Invalid status filter'),
  
  query('category')
    .optional()
    .isIn([
      'pest_management',
      'disease_control',
      'fertilizer_advice',
      'weather_guidance',
      'crop_planning',
      'market_information',
      'government_schemes',
      'general_query',
      'other'
    ])
    .withMessage('Invalid category filter')
];

// Routes
router.post('/', authenticateToken, createThreadValidation, threadController.createThread);
router.get('/', authenticateToken, queryValidation, threadController.getThreads);
router.get('/:threadId', authenticateToken, threadIdValidation, threadController.getThread);
router.put('/:threadId', authenticateToken, updateThreadValidation, threadController.updateThread);
router.delete('/:threadId', authenticateToken, threadIdValidation, threadController.deleteThread);
router.post('/:threadId/feedback', authenticateToken, feedbackValidation, threadController.addFeedback);
router.get('/:threadId/messages', authenticateToken, threadIdValidation, threadController.getThreadMessages);

module.exports = router;
