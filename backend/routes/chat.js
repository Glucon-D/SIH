const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { uploadAudio, handleUploadError } = require('../middleware/audioUpload');

const router = express.Router();

// Validation rules
const sendMessageValidation = [
  body('threadId')
    .isMongoId()
    .withMessage('Invalid thread ID'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message content must be between 1 and 10000 characters'),
  
  body('role')
    .optional()
    .isIn(['user', 'assistant', 'system'])
    .withMessage('Invalid message role')
];

const streamChatValidation = [
  body('threadId')
    .isMongoId()
    .withMessage('Invalid thread ID'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message must be between 1 and 10000 characters'),
  
  body('model')
    .optional()
    .isString()
    .withMessage('Model must be a string')
];

// Routes
router.post('/send', authenticateToken, sendMessageValidation, chatController.sendMessage);
router.post('/stream', authenticateToken, streamChatValidation, chatController.streamChat);
router.post('/transcribe', authenticateToken, uploadAudio, handleUploadError, chatController.transcribeAudio);
router.get('/history/:threadId', authenticateToken, chatController.getChatHistory);
router.delete('/message/:messageId', authenticateToken, chatController.deleteMessage);
router.put('/message/:messageId', authenticateToken, chatController.editMessage);
router.post('/message/:messageId/reaction', authenticateToken, chatController.addReaction);
router.delete('/message/:messageId/reaction', authenticateToken, chatController.removeReaction);

module.exports = router;
