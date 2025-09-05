const multer = require('multer');
const logger = require('../utils/logger');

// Configure multer for memory storage (no file system writes)
const storage = multer.memoryStorage();

// File filter for audio files
const fileFilter = (req, file, cb) => {
  // Accept audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
    files: 1 // Only one file at a time
  }
});

// Middleware for single audio file upload
const uploadAudio = upload.single('audio');

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error(`Multer error: ${error.message}`);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Audio file too large. Maximum size is 25MB.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "audio" field name.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error'
    });
  }
  
  if (error.message === 'Only audio files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only audio files are allowed'
    });
  }
  
  logger.error(`Upload error: ${error.message}`);
  return res.status(500).json({
    success: false,
    message: 'Internal server error during file upload'
  });
};

module.exports = {
  uploadAudio,
  handleUploadError
};
