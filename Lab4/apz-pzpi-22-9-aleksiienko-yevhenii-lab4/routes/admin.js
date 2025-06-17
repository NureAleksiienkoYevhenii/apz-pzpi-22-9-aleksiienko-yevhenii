const express = require('express');
const User = require('../models/User');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, querySchemas, validateObjectId } = require('../middleware/validation');
const mqttService = require('../services/mqttService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const userStats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      newToday: await User.countDocuments({ createdAt: { $gte: today } }),
      newThisWeek: await User.countDocuments({ createdAt: { $gte: lastWeek } }),
      admins: await User.countDocuments({ role: 'admin', isActive: true })
    };

    // Device statistics
    const deviceStats = {
      total: await Device.countDocuments({ isActive: true }),
      online: await Device.countDocuments({ 'status.isOnline': true, isActive: true }),
      newToday: await Device.countDocuments({ createdAt: { $gte: today }, isActive: true }),
      newThisWeek: await Device.countDocuments({ createdAt: { $gte: lastWeek }, isActive: true }),
      byType: await Device.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } }
      ])
    };

    // Data statistics
    const dataStats = {
      totalToday: await SensorData.countDocuments({ createdAt: { $gte: today } }),
      totalThisWeek: await SensorData.countDocuments({ createdAt: { $gte: lastWeek } }),
      alertsToday: await SensorData.countDocuments({
        alertLevel: { $in: ['warning', 'critical'] },
        createdAt: { $gte: today }
      }),
      alertsThisWeek: await SensorData.countDocuments({
        alertLevel: { $in: ['warning', 'critical'] },
        createdAt: { $gte: lastWeek }
      }),
      bySensorType: await SensorData.aggregate([
        { $match: { createdAt: { $gte: lastWeek } } },
        { $group: { _id: '$sensorType', count: { $sum: 1 } } }
      ])
    };

    // System health
    const systemHealth = {
      mqtt: mqttService.getStatus(),
      ai: {
        available: aiService.isServiceAvailable(),
        status: aiService.isServiceAvailable() ? 'operational' : 'unavailable'
      },
      database: {
        status: 'operational', // MongoDB connection is checked in main app
        collections: {
          users: await User.estimatedDocumentCount(),
          devices: await Device.estimatedDocumentCount(),
          sensorData: await SensorData.estimatedDocumentCount()
        }
      }
    };

    // Recent activity
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email createdAt lastLogin role');

    const recentDevices = await Device.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('deviceId name location userId createdAt status.isOnline')
      .populate('userId', 'username email');

    const recentAlerts = await SensorData.find({
      alertLevel: { $in: ['warning', 'critical'] }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('deviceId sensorType alertLevel data createdAt');

    res.json({
      success: true,
      data: {
        statistics: {
          users: userStats,
          devices: deviceStats,
          data: dataStats
        },
        systemHealth,
        recentActivity: {
          users: recentUsers,
          devices: recentDevices,
          alerts: recentAlerts
        },
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/users', validate(querySchemas.pagination, 'query'), async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const { search, role, isActive } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password -refreshToken');

    const total = await User.countDocuments(filter);

    // Get device counts for each user
    const usersWithStats = await Promise.all(
      users.map(async user => {
        const deviceCount = await Device.countDocuments({ userId: user._id, isActive: true });
        const recentDataCount = await SensorData.countDocuments({
          userId: user._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        return {
          ...user.toObject(),
          stats: {
            devices: deviceCount,
            recentData: recentDataCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    logger.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details (admin only)
 * @access  Admin
 */
router.get('/users/:userId', validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's devices
    const devices = await Device.find({ userId, isActive: true });

    // Get recent activity
    const recentData = await SensorData.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('deviceId sensorType alertLevel createdAt');

    // Get user statistics
    const stats = {
      devices: devices.length,
      totalDataPoints: await SensorData.countDocuments({ userId }),
      totalAlerts: await SensorData.countDocuments({
        userId,
        alertLevel: { $in: ['warning', 'critical'] }
      }),
      joinDate: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      data: {
        user,
        devices,
        recentData,
        stats
      }
    });

  } catch (error) {
    logger.error('Get admin user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user (admin only)
 * @access  Admin
 */
router.put('/users/:userId', validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can update role and isActive status
    const allowedUpdates = ['role', 'isActive', 'preferences'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'preferences') {
          user.preferences = { ...user.preferences, ...updates.preferences };
        } else {
          user[field] = updates[field];
        }
      }
    });

    await user.save();

    logger.info(`Admin updated user ${userId}`, {
      adminId: req.user._id,
      updatedFields: Object.keys(updates),
      targetUserId: userId
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

/**
 * @route   GET /api/admin/devices
 * @desc    Get all devices (admin only)
 * @access  Admin
 */
router.get('/devices', validate(querySchemas.pagination, 'query'), async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const { search, deviceType, isOnline, isActive } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { deviceId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (deviceType) filter.deviceType = deviceType;
    if (isOnline !== undefined) filter['status.isOnline'] = isOnline === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const devices = await Device.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');

    const total = await Device.countDocuments(filter);

    // Get data counts for each device
    const devicesWithStats = await Promise.all(
      devices.map(async device => {
        const dataCount = await SensorData.countDocuments({ deviceId: device.deviceId });
        const alertCount = await SensorData.countDocuments({
          deviceId: device.deviceId,
          alertLevel: { $in: ['warning', 'critical'] }
        });

        return {
          ...device.toObject(),
          stats: {
            dataPoints: dataCount,
            alerts: alertCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        devices: devicesWithStats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    logger.error('Get admin devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices'
    });
  }
});

/**
 * @route   POST /api/admin/devices/:deviceId/command
 * @desc    Send command to any device (admin only)
 * @access  Admin
 */
router.post('/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Send command via MQTT
    const commandData = {
      command,
      parameters: parameters || {},
      timestamp: Date.now(),
      adminId: req.user._id.toString(),
      isAdminCommand: true
    };

    const success = mqttService.sendCommand(deviceId, commandData);

    if (!success) {
      return res.status(503).json({
        success: false,
        message: 'Failed to send command - MQTT service unavailable'
      });
    }

    logger.logDeviceEvent(deviceId, 'admin_command_sent', {
      command,
      parameters,
      adminId: req.user._id.toString()
    });

    res.json({
      success: true,
      message: 'Admin command sent successfully',
      data: {
        command,
        parameters,
        timestamp: commandData.timestamp
      }
    });

  } catch (error) {
    logger.error('Send admin device command error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send command'
    });
  }
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Admin
 */
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: 'operational',
          responseTime: null
        },
        mqtt: mqttService.getStatus(),
        ai: {
          available: aiService.isServiceAvailable(),
          status: aiService.isServiceAvailable() ? 'operational' : 'unavailable'
        }
      },
      metrics: {
        totalUsers: await User.countDocuments(),
        totalDevices: await Device.countDocuments(),
        onlineDevices: await Device.countDocuments({ 'status.isOnline': true }),
        dataPointsToday: await SensorData.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      }
    };

    // Test database response time
    const dbStart = Date.now();
    await User.findOne().limit(1);
    health.services.database.responseTime = Date.now() - dbStart;

    // Determine overall health
    const services = Object.values(health.services);
    const unhealthyServices = services.filter(service => 
      service.status !== 'operational' && service.connected !== true
    );

    if (unhealthyServices.length > 0) {
      health.status = 'degraded';
    }

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health',
      data: {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      }
    });
  }
});

/**
 * @route   GET /api/admin/system/logs
 * @desc    Get system logs (last 100 entries)
 * @access  Admin
 */
router.get('/system/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // This would ideally read from log files or a logging database
    // For now, return a placeholder response
    const logs = [
      {
        level: 'info',
        message: 'System logs endpoint accessed',
        timestamp: new Date(),
        meta: { adminId: req.user._id }
      }
    ];

    res.json({
      success: true,
      data: {
        logs,
        level,
        limit: parseInt(limit),
        note: 'Full log integration pending - check server log files for complete logs'
      }
    });

  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs'
    });
  }
});

/**
 * @route   POST /api/admin/system/maintenance
 * @desc    Trigger system maintenance tasks
 * @access  Admin
 */
router.post('/system/maintenance', async (req, res) => {
  try {
    const { task } = req.body;

    const results = {};

    switch (task) {
      case 'cleanup_old_data':
        // Clean up sensor data older than 1 year
        const oldDataDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const deletedCount = await SensorData.deleteMany({
          createdAt: { $lt: oldDataDate },
          alertLevel: 'normal'
        });
        results.cleanupOldData = { deletedRecords: deletedCount.deletedCount };
        break;

      case 'update_device_stats':
        // Update device statistics
        const devices = await Device.find({ isActive: true });
        for (const device of devices) {
          const dataCount = await SensorData.countDocuments({ deviceId: device.deviceId });
          device.statistics.dataPoints.thisMonth = dataCount;
          await device.save();
        }
        results.updateDeviceStats = { updatedDevices: devices.length };
        break;

      case 'check_stale_devices':
        // Mark stale devices as offline
        const staleDevices = await Device.findStale(30); // 30 minutes
        for (const device of staleDevices) {
          await device.markOffline();
        }
        results.checkStaleDevices = { markedOffline: staleDevices.length };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance task'
        });
    }

    logger.info(`Admin maintenance task executed: ${task}`, {
      adminId: req.user._id,
      results
    });

    res.json({
      success: true,
      message: 'Maintenance task completed',
      data: {
        task,
        results,
        executedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('System maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute maintenance task'
    });
  }
});

/**
 * @route   GET /api/admin/analytics/global
 * @desc    Get global analytics across all users
 * @access  Admin
 */
router.get('/analytics/global', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Global temperature trends
    const temperatureTrends = await SensorData.aggregate([
      {
        $match: {
          sensorType: 'temperature',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          avgTemperature: { $avg: '$data.temperature' },
          maxTemperature: { $max: '$data.temperature' },
          minTemperature: { $min: '$data.temperature' },
          deviceCount: { $addToSet: '$deviceId' },
          alertCount: { $sum: { $cond: [{ $in: ['$alertLevel', ['warning', 'critical']] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Global motion patterns
    const motionPatterns = await SensorData.aggregate([
      {
        $match: {
          sensorType: 'motion',
          'data.motionDetected': true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' }
          },
          motionEvents: { $sum: 1 },
          uniqueDevices: { $addToSet: '$deviceId' }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]);

    // Device usage statistics
    const deviceUsage = await Device.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          onlineCount: { $sum: { $cond: ['$status.isOnline', 1, 0] } },
          avgUptime: { $avg: '$statistics.totalUptime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        temperatureTrends,
        motionPatterns,
        deviceUsage,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get global analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global analytics'
    });
  }
});

module.exports = router;