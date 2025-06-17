const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validate, userSchemas } = require('../middleware/validation');
const { authenticate, userRateLimit } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Apply rate limiting to auth routes
router.use(userRateLimit(15 * 60 * 1000, 20)); // 20 requests per 15 minutes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(userSchemas.register), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      profile: {
        firstName,
        lastName,
        phone
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`New user registered: ${email}`, {
      userId: user._id,
      username,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(userSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.logSecurity('Failed login attempt - user not found', null, req.ip, { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.logSecurity('Failed login attempt - inactive user', user._id, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.logSecurity('Failed login attempt - invalid password', user._id, req.ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`User logged in: ${email}`, {
      userId: user._id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(userSchemas.updateProfile), async (req, res) => {
  try {
    const updates = req.body;
    const user = req.user;

    // Update profile fields
    if (updates.firstName !== undefined) {
      user.profile.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      user.profile.lastName = updates.lastName;
    }
    if (updates.phone !== undefined) {
      user.profile.phone = updates.phone;
    }
    if (updates.timezone !== undefined) {
      user.profile.timezone = updates.timezone;
    }

    // Update preferences
    if (updates.preferences) {
      if (updates.preferences.notifications) {
        Object.assign(user.preferences.notifications, updates.preferences.notifications);
      }
      if (updates.preferences.thresholds) {
        Object.assign(user.preferences.thresholds, updates.preferences.thresholds);
      }
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`, {
      userId: user._id,
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validate(userSchemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      logger.logSecurity('Failed password change - invalid current password', user._id, req.ip);
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.logSecurity('Password changed successfully', user._id, req.ip);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // Generate new token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`, {
      userId: req.user._id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // Soft delete - mark as inactive instead of removing
    user.isActive = false;
    await user.save();

    logger.logSecurity('User account deactivated', user._id, req.ip);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

/**
 * @route   GET /api/auth/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const Device = require('../models/Device');
    const SensorData = require('../models/SensorData');

    // Get user's device count
    const deviceCount = await Device.countDocuments({ userId: user._id, isActive: true });
    
    // Get recent activity
    const devices = await Device.find({ userId: user._id, isActive: true });
    const deviceIds = devices.map(d => d.deviceId);

    const recentDataCount = deviceIds.length > 0 ? await SensorData.countDocuments({
      deviceId: { $in: deviceIds },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }) : 0;

    const alertsCount = deviceIds.length > 0 ? await SensorData.countDocuments({
      deviceId: { $in: deviceIds },
      alertLevel: { $in: ['warning', 'critical'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }) : 0;

    res.json({
      success: true,
      data: {
        devices: deviceCount,
        recentData: recentDataCount,
        weeklyAlerts: alertsCount,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router;