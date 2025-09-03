const { validationResult } = require('express-validator');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// Get user profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updates = req.body;
    const user = req.user;

    // Update user fields
    Object.keys(updates).forEach(key => {
      if (key === 'profile' && typeof updates[key] === 'object') {
        user.profile = { ...user.profile, ...updates[key] };
      } else if (key === 'preferences' && typeof updates[key] === 'object') {
        user.preferences = { ...user.preferences, ...updates[key] };
      } else if (key !== 'password' && key !== 'email') {
        user[key] = updates[key];
      }
    });

    await user.save();

    logger.info(`Profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalThreads,
      activeThreads,
      resolvedThreads,
      totalMessages,
      userMessages,
      assistantMessages
    ] = await Promise.all([
      Thread.countDocuments({ userId, isActive: true }),
      Thread.countDocuments({ userId, status: 'active', isActive: true }),
      Thread.countDocuments({ userId, status: 'resolved', isActive: true }),
      Message.countDocuments({ userId, isVisible: true }),
      Message.countDocuments({ userId, role: 'user', isVisible: true }),
      Message.countDocuments({ userId, role: 'assistant', isVisible: true })
    ]);

    // Get category breakdown
    const categoryStats = await Thread.aggregate([
      { $match: { userId, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentThreads = await Thread.find({ userId, isActive: true })
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .select('title category lastMessageAt status');

    const stats = {
      threads: {
        total: totalThreads,
        active: activeThreads,
        resolved: resolvedThreads,
        archived: totalThreads - activeThreads - resolvedThreads
      },
      messages: {
        total: totalMessages,
        sent: userMessages,
        received: assistantMessages
      },
      categories: categoryStats,
      recentActivity: recentThreads
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    logger.error(`Get user stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
};

// Get user activity
const getUserActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const skip = (page - 1) * limit;

    // Get recent messages with thread info
    const recentMessages = await Message.find({ userId, isVisible: true })
      .populate('threadId', 'title category')
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('role content createdOn threadId');

    const totalMessages = await Message.countDocuments({ userId, isVisible: true });

    res.json({
      success: true,
      data: {
        activity: recentMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Get user activity error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    });
  }
};

// Delete user account (soft delete)
const deleteAccount = async (req, res) => {
  try {
    const user = req.user;

    // Soft delete user
    user.isActive = false;
    await user.save();

    // Soft delete all user's threads and messages
    await Promise.all([
      Thread.updateMany({ userId: user._id }, { isActive: false }),
      Message.updateMany({ userId: user._id }, { isVisible: false })
    ]);

    logger.info(`Account deleted: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

// Deactivate user account
const deactivateAccount = async (req, res) => {
  try {
    const user = req.user;

    user.isActive = false;
    await user.save();

    logger.info(`Account deactivated: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    logger.error(`Deactivate account error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
};

// Reactivate user account
const reactivateAccount = async (req, res) => {
  try {
    const user = req.user;

    user.isActive = true;
    await user.save();

    logger.info(`Account reactivated: ${user.email}`);

    res.json({
      success: true,
      message: 'Account reactivated successfully'
    });
  } catch (error) {
    logger.error(`Reactivate account error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account'
    });
  }
};

// Get user by ID (admin function)
const getUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

// Get all users (admin function)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getUserActivity,
  deleteAccount,
  deactivateAccount,
  reactivateAccount,
  getUserById,
  getAllUsers
};
