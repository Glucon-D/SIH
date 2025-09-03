const { validationResult } = require('express-validator');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// Create new thread
const createThread = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, priority, tags, metadata } = req.body;
    const userId = req.user._id;

    const thread = new Thread({
      userId,
      title,
      description,
      category,
      priority,
      tags,
      metadata
    });

    await thread.save();
    await thread.populate('userId', 'username profile.firstName profile.lastName');

    logger.info(`Thread created: ${thread._id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: {
        thread
      }
    });
  } catch (error) {
    logger.error(`Create thread error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create thread'
    });
  }
};

// Get threads for user
const getThreads = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, status, category, search } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { userId, isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [threads, total] = await Promise.all([
      Thread.find(query)
        .populate('userId', 'username profile.firstName profile.lastName')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Thread.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        threads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Get threads error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get threads'
    });
  }
};

// Get single thread
const getThread = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { threadId } = req.params;
    const userId = req.user._id;

    const thread = await Thread.findOne({ _id: threadId, userId })
      .populate('userId', 'username profile.firstName profile.lastName');

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    res.json({
      success: true,
      data: {
        thread
      }
    });
  } catch (error) {
    logger.error(`Get thread error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get thread'
    });
  }
};

// Update thread
const updateThread = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { threadId } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key === 'metadata' && typeof updates[key] === 'object') {
        thread.metadata = { ...thread.metadata, ...updates[key] };
      } else if (updates[key] !== undefined) {
        thread[key] = updates[key];
      }
    });

    // If marking as resolved, set resolvedAt
    if (updates.status === 'resolved' && thread.status !== 'resolved') {
      thread.resolvedAt = new Date();
    }

    await thread.save();
    await thread.populate('userId', 'username profile.firstName profile.lastName');

    logger.info(`Thread updated: ${threadId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Thread updated successfully',
      data: {
        thread
      }
    });
  } catch (error) {
    logger.error(`Update thread error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update thread'
    });
  }
};

// Delete thread (soft delete)
const deleteThread = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { threadId } = req.params;
    const userId = req.user._id;

    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    thread.isActive = false;
    await thread.save();

    // Also soft delete all messages in the thread
    await Message.updateMany(
      { threadId },
      { isVisible: false }
    );

    logger.info(`Thread deleted: ${threadId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Thread deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete thread error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete thread'
    });
  }
};

// Add feedback to thread
const addFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { threadId } = req.params;
    const { rating, comment, helpful } = req.body;
    const userId = req.user._id;

    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    thread.feedback = {
      rating,
      comment,
      helpful,
      submittedAt: new Date()
    };

    await thread.save();

    logger.info(`Feedback added to thread: ${threadId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: {
        feedback: thread.feedback
      }
    });
  } catch (error) {
    logger.error(`Add feedback error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback'
    });
  }
};

// Get thread messages
const getThreadMessages = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify thread exists and belongs to user
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const skip = (page - 1) * limit;
    const messages = await Message.findByThread(threadId, limit, skip);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: thread.messageCount
        }
      }
    });
  } catch (error) {
    logger.error(`Get thread messages error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get thread messages'
    });
  }
};

module.exports = {
  createThread,
  getThreads,
  getThread,
  updateThread,
  deleteThread,
  addFeedback,
  getThreadMessages
};
