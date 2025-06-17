const express = require('express');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const { authenticate, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, deviceSchemas, querySchemas, validateDeviceId, validateObjectId } = require('../middleware/validation');
const DeviceGenerator = require('../utils/deviceGenerator');
const mqttService = require('../services/mqttService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/devices
 * @desc    Get user's devices
 * @access  Private
 */
router.get('/', authenticate, validate(querySchemas.pagination, 'query'), async (req, res) => {
  try {
    const { page, limit, sort } = req.query;
    const userId = req.user._id;

    const skip = (page - 1) * limit;

    const devices = await Device.find({ userId, isActive: true })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');

    const total = await Device.countDocuments({ userId, isActive: true });

    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    logger.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices'
    });
  }
});

/**
 * @route   POST /api/devices
 * @desc    Create a new device
 * @access  Private
 */
router.post('/', authenticate, validate(deviceSchemas.create), async (req, res) => {
  try {
    const { name, description, location, deviceType, configuration } = req.body;
    const userId = req.user._id;

    // Generate unique device ID
    const deviceId = await DeviceGenerator.generateUniqueDeviceId(userId.toString());

    // Create device with default configuration
    const device = new Device({
      deviceId,
      userId,
      name,
      description,
      location,
      deviceType: deviceType || 'monitoring_station',
      configuration: {
        ...DeviceGenerator.generateDefaultConfiguration(deviceType),
        ...configuration
      },
      status: DeviceGenerator.generateDefaultStatus(),
      statistics: DeviceGenerator.generateDefaultStatistics()
    });

    await device.save();

    logger.logDeviceEvent(deviceId, 'device_created', {
      userId: userId.toString(),
      name,
      location
    });

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: {
        device,
        qrCode: DeviceGenerator.generateQRCodeData(deviceId, {
          name,
          location,
          userId: userId.toString()
        })
      }
    });

  } catch (error) {
    logger.error('Create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device'
    });
  }
});

/**
 * @route   GET /api/devices/:deviceId
 * @desc    Get device by ID
 * @access  Private
 */
router.get('/:deviceId', authenticate, validateDeviceId, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    }).populate('userId', 'username email');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Get recent sensor data
    const recentData = await SensorData.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        device,
        recentData
      }
    });

  } catch (error) {
    logger.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device'
    });
  }
});

/**
 * @route   PUT /api/devices/:deviceId
 * @desc    Update device
 * @access  Private
 */
router.put('/:deviceId', authenticate, validateDeviceId, validate(deviceSchemas.update), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'location', 'configuration', 'isActive'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'configuration') {
          // Deep merge configuration
          device.configuration = {
            ...device.configuration,
            ...updates.configuration
          };
        } else {
          device[field] = updates[field];
        }
      }
    });

    await device.save();

    logger.logDeviceEvent(deviceId, 'device_updated', {
      userId: userId.toString(),
      updatedFields: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: {
        device
      }
    });

  } catch (error) {
    logger.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device'
    });
  }
});

/**
 * @route   DELETE /api/devices/:deviceId
 * @desc    Delete device (soft delete)
 * @access  Private
 */
router.delete('/:deviceId', authenticate, validateDeviceId, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Soft delete
    device.isActive = false;
    await device.save();

    logger.logDeviceEvent(deviceId, 'device_deleted', {
      userId: userId.toString()
    });

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });

  } catch (error) {
    logger.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device'
    });
  }
});

/**
 * @route   GET /api/devices/:deviceId/data
 * @desc    Get device sensor data
 * @access  Private
 */
router.get('/:deviceId/data', authenticate, validateDeviceId, validate(querySchemas.dateRange, 'query'), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, period } = req.query;
    const userId = req.user._id;

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    let query = { deviceId };

    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    } else {
      // Default to last 24 hours
      query.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    }

    const sensorData = await SensorData.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);

    // Get aggregated data if period is specified
    const aggregatedData = await SensorData.getAggregatedData(deviceId, 'temperature', period);

    res.json({
      success: true,
      data: {
        rawData: sensorData,
        aggregatedData,
        period,
        deviceInfo: {
          deviceId: device.deviceId,
          name: device.name,
          location: device.location
        }
      }
    });

  } catch (error) {
    logger.error('Get device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device data'
    });
  }
});

/**
 * @route   GET /api/devices/:deviceId/alerts
 * @desc    Get device alerts
 * @access  Private
 */
router.get('/:deviceId/alerts', authenticate, validateDeviceId, validate(querySchemas.pagination, 'query'), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user._id;

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const skip = (page - 1) * limit;

    const alerts = await SensorData.find({
      deviceId,
      alertLevel: { $in: ['warning', 'critical'] }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await SensorData.countDocuments({
      deviceId,
      alertLevel: { $in: ['warning', 'critical'] }
    });

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    logger.error('Get device alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device alerts'
    });
  }
});

/**
 * @route   POST /api/devices/:deviceId/command
 * @desc    Send command to device
 * @access  Private
 */
router.post('/:deviceId/command', authenticate, validateDeviceId, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters } = req.body;
    const userId = req.user._id;

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Validate command
    const allowedCommands = ['reboot', 'update_config', 'test_sensors', 'calibrate'];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid command'
      });
    }

    // Send command via MQTT
    const commandData = {
      command,
      parameters: parameters || {},
      timestamp: Date.now(),
      userId: userId.toString()
    };

    const success = mqttService.sendCommand(deviceId, commandData);

    if (!success) {
      return res.status(503).json({
        success: false,
        message: 'Failed to send command - MQTT service unavailable'
      });
    }

    logger.logDeviceEvent(deviceId, 'command_sent', {
      command,
      parameters,
      userId: userId.toString()
    });

    res.json({
      success: true,
      message: 'Command sent successfully',
      data: {
        command,
        parameters,
        timestamp: commandData.timestamp
      }
    });

  } catch (error) {
    logger.error('Send device command error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send command'
    });
  }
});

/**
 * @route   GET /api/devices/:deviceId/report
 * @desc    Generate AI-powered device report
 * @access  Private
 */
router.get('/:deviceId/report', authenticate, validateDeviceId, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h' } = req.query;
    const userId = req.user._id;

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (!aiService.isServiceAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
    }

    const report = await aiService.generateDeviceReport(deviceId, timeRange);

    logger.logDeviceEvent(deviceId, 'report_generated', {
      timeRange,
      userId: userId.toString()
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate device report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

/**
 * @route   GET /api/devices/:deviceId/status
 * @desc    Get device real-time status
 * @access  Private
 */
router.get('/:deviceId/status', authenticate, validateDeviceId, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ 
      deviceId, 
      userId: req.user.role === 'admin' ? { $exists: true } : userId,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Get latest sensor data
    const latestTemperature = await SensorData.getLatest(deviceId, 'temperature', 1);
    const latestMotion = await SensorData.getLatest(deviceId, 'motion', 1);
    const latestSystem = await SensorData.getLatest(deviceId, 'system', 1);

    // Calculate uptime
    const uptimeSeconds = Math.floor((Date.now() - device.createdAt) / 1000);

    res.json({
      success: true,
      data: {
        deviceId: device.deviceId,
        name: device.name,
        location: device.location,
        status: device.status,
        uptime: uptimeSeconds,
        latestData: {
          temperature: latestTemperature[0] || null,
          motion: latestMotion[0] || null,
          system: latestSystem[0] || null
        },
        mqttStatus: mqttService.getStatus()
      }
    });

  } catch (error) {
    logger.error('Get device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device status'
    });
  }
});

module.exports = router;