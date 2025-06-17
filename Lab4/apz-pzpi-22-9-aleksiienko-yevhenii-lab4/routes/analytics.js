const express = require('express');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const { authenticate } = require('../middleware/auth');
const { validate, querySchemas } = require('../middleware/validation');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics data
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user's devices
    const devices = await Device.find({ userId, isActive: true });
    const deviceIds = devices.map(d => d.deviceId); // Это строки deviceId, не ObjectId!

    // Базовая статистика
    const stats = {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status.isOnline).length,
      
      // Точки данных за последние 24 часа - используем deviceId
      dataPointsToday: deviceIds.length > 0 ? await SensorData.countDocuments({
        deviceId: { $in: deviceIds },
        createdAt: { $gte: yesterday }
      }) : 0,
      
      // Оповещения за последнюю неделю - используем deviceId
      alertsThisWeek: deviceIds.length > 0 ? await SensorData.countDocuments({
        deviceId: { $in: deviceIds },
        alertLevel: { $in: ['warning', 'critical'] },
        createdAt: { $gte: lastWeek }
      }) : 0
    };

    // Последние оповещения - используем deviceId
    const recentAlerts = deviceIds.length > 0 ? await SensorData.find({
      deviceId: { $in: deviceIds },
      alertLevel: { $in: ['warning', 'critical'] }
    })
    .sort({ createdAt: -1 })
    .limit(10) : [];

    // Тренды температуры (последние 24 часа) - используем deviceId
    const temperatureTrends = deviceIds.length > 0 ? await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'temperature',
          createdAt: { $gte: yesterday }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            deviceId: '$deviceId'
          },
          avgTemperature: { $avg: '$data.temperature' },
          maxTemperature: { $max: '$data.temperature' },
          minTemperature: { $min: '$data.temperature' },
          dataPoints: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.hour': 1 }
      }
    ]) : [];

    // Активность движения - используем deviceId
    const motionActivity = deviceIds.length > 0 ? await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'motion',
          createdAt: { $gte: yesterday }
        }
      },
      {
        $group: {
          _id: '$data.location',
          motionEvents: { $sum: { $cond: ['$data.motionDetected', 1, 0] } },
          totalEvents: { $sum: 1 }
        }
      },
      {
        $sort: { motionEvents: -1 }
      }
    ]) : [];

    // Показатели здоровья устройств
    const deviceHealth = devices.map(device => {
      const batteryScore = device.status.battery?.level || 100;
      const connectivityScore = device.status.isOnline ? 100 : 0;
      const alertPenalty = Math.min(device.statistics.totalAlerts * 2, 30);
      
      const healthScore = Math.max(
        (batteryScore * 0.3 + connectivityScore * 0.5) - alertPenalty,
        0
      );

      return {
        deviceId: device.deviceId,
        name: device.name,
        location: device.location,
        healthScore: Math.round(healthScore),
        isOnline: device.status.isOnline,
        lastSeen: device.status.lastSeen,
        battery: device.status.battery?.level
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        recentAlerts,
        temperatureTrends,
        motionActivity,
        deviceHealth,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/temperature
 * @desc    Get temperature analytics
 * @access  Private
 */
router.get('/temperature', authenticate, validate(querySchemas.dateRange, 'query'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, period } = req.query;

    // Установить диапазон дат по умолчанию, если не указан
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Получить устройства пользователя
    const devices = await Device.find({ userId, isActive: true });
    const deviceIds = devices.map(d => d.deviceId);

    if (deviceIds.length === 0) {
      return res.json({
        success: true,
        data: {
          devices: [],
          trends: [],
          statistics: {},
          anomalies: []
        }
      });
    }

    // Тренды температуры по устройствам - используем deviceId
    const trends = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'temperature',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            deviceId: '$deviceId',
            period: period === 'hour' ? 
              { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
              { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          avgTemperature: { $avg: '$data.temperature' },
          maxTemperature: { $max: '$data.temperature' },
          minTemperature: { $min: '$data.temperature' },
          avgHumidity: { $avg: '$data.humidity' },
          dataPoints: { $sum: 1 },
          alerts: { $sum: { $cond: [{ $in: ['$alertLevel', ['warning', 'critical']] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.period': 1 }
      }
    ]);

    // Общая статистика - используем deviceId
    const overallStats = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'temperature',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$data.temperature' },
          maxTemperature: { $max: '$data.temperature' },
          minTemperature: { $min: '$data.temperature' },
          avgHumidity: { $avg: '$data.humidity' },
          totalDataPoints: { $sum: 1 },
          totalAlerts: { $sum: { $cond: [{ $in: ['$alertLevel', ['warning', 'critical']] }, 1, 0] } }
        }
      }
    ]);

    // Найти аномалии температуры - используем deviceId
    const anomalies = await SensorData.find({
      deviceId: { $in: deviceIds },
      sensorType: 'temperature',
      'processingResult.anomaly': true,
      createdAt: { $gte: start, $lte: end }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('deviceId data.temperature processingResult.confidence createdAt alertLevel');

    // Статистика по устройствам
    const deviceStats = await Promise.all(
      devices.map(async device => {
        const deviceData = await SensorData.aggregate([
          {
            $match: {
              deviceId: device.deviceId,
              sensorType: 'temperature',
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              avgTemperature: { $avg: '$data.temperature' },
              maxTemperature: { $max: '$data.temperature' },
              minTemperature: { $min: '$data.temperature' },
              dataPoints: { $sum: 1 },
              alerts: { $sum: { $cond: [{ $in: ['$alertLevel', ['warning', 'critical']] }, 1, 0] } }
            }
          }
        ]);

        return {
          deviceId: device.deviceId,
          name: device.name,
          location: device.location,
          statistics: deviceData[0] || {
            avgTemperature: null,
            maxTemperature: null,
            minTemperature: null,
            dataPoints: 0,
            alerts: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        devices: deviceStats,
        trends,
        statistics: overallStats[0] || {},
        anomalies,
        period: {
          start,
          end,
          granularity: period
        }
      }
    });

  } catch (error) {
    logger.error('Get temperature analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get temperature analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/motion
 * @desc    Get motion analytics
 * @access  Private
 */
router.get('/motion', authenticate, validate(querySchemas.dateRange, 'query'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, period } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const devices = await Device.find({ userId, isActive: true });
    const deviceIds = devices.map(d => d.deviceId);

    if (deviceIds.length === 0) {
      return res.json({
        success: true,
        data: {
          patterns: [],
          locationActivity: [],
          hourlyDistribution: [],
          statistics: {}
        }
      });
    }

    // Паттерны движения во времени - используем deviceId
    const motionPatterns = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'motion',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            deviceId: '$deviceId',
            location: '$data.location',
            period: period === 'hour' ? 
              { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
              { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          motionEvents: { $sum: { $cond: ['$data.motionDetected', 1, 0] } },
          totalEvents: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.period': 1 }
      }
    ]);

    // Активность по местоположению - используем deviceId
    const locationActivity = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'motion',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$data.location',
          motionEvents: { $sum: { $cond: ['$data.motionDetected', 1, 0] } },
          totalEvents: { $sum: 1 },
          devices: { $addToSet: '$deviceId' }
        }
      },
      {
        $sort: { motionEvents: -1 }
      }
    ]);

    // Почасовое распределение - используем deviceId
    const hourlyDistribution = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'motion',
          'data.motionDetected': true,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          motionEvents: { $sum: 1 },
          locations: { $addToSet: '$data.location' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Общая статистика - используем deviceId
    const overallStats = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          sensorType: 'motion',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          motionEvents: { $sum: { $cond: ['$data.motionDetected', 1, 0] } },
          uniqueLocations: { $addToSet: '$data.location' },
          peakHour: { $push: { $hour: '$createdAt' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        patterns: motionPatterns,
        locationActivity,
        hourlyDistribution,
        statistics: overallStats[0] || {},
        period: {
          start,
          end,
          granularity: period
        }
      }
    });

  } catch (error) {
    logger.error('Get motion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get motion analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/recommendations
 * @desc    Get AI-powered recommendations
 * @access  Private
 */
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { deviceIds } = req.query;

    if (!aiService.isServiceAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
    }

    const deviceIdArray = deviceIds ? deviceIds.split(',') : null;
    const recommendations = await aiService.getRecommendations(userId, deviceIdArray);

    logger.info(`AI recommendations generated for user ${userId}`, {
      deviceIds: deviceIdArray,
      recommendationCount: recommendations.length
    });

    res.json({
      success: true,
      data: {
        recommendations,
        generatedAt: new Date(),
        deviceIds: deviceIdArray
      }
    });

  } catch (error) {
    logger.error('Get AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

/**
 * @route   GET /api/analytics/alerts
 * @desc    Get alerts analytics
 * @access  Private
 */
router.get('/alerts', authenticate, validate(querySchemas.dateRange, 'query'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const devices = await Device.find({ userId, isActive: true });
    const deviceIds = devices.map(d => d.deviceId);

    // Оповещения по уровню важности - используем deviceId
    const alertsBySeverity = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          alertLevel: { $in: ['warning', 'critical'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$alertLevel',
          count: { $sum: 1 },
          devices: { $addToSet: '$deviceId' }
        }
      }
    ]);

    // Оповещения по устройствам - используем deviceId
    const alertsByDevice = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          alertLevel: { $in: ['warning', 'critical'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$deviceId',
          totalAlerts: { $sum: 1 },
          warningAlerts: { $sum: { $cond: [{ $eq: ['$alertLevel', 'warning'] }, 1, 0] } },
          criticalAlerts: { $sum: { $cond: [{ $eq: ['$alertLevel', 'critical'] }, 1, 0] } },
          sensorTypes: { $addToSet: '$sensorType' }
        }
      },
      {
        $sort: { totalAlerts: -1 }
      }
    ]);

    // Тренды оповещений во времени - используем deviceId
    const alertTrends = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          alertLevel: { $in: ['warning', 'critical'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            alertLevel: '$alertLevel'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Последние критические оповещения - используем deviceId
    const recentCriticalAlerts = await SensorData.find({
      deviceId: { $in: deviceIds },
      alertLevel: 'critical',
      createdAt: { $gte: start, $lte: end }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('deviceId sensorType data alertLevel createdAt processingResult');

    // Анализ разрешения оповещений - используем deviceId
    const alertResolution = await SensorData.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          alertLevel: { $in: ['warning', 'critical'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$sensorType',
          avgResponseTime: { $avg: '$processingResult.processingTime' },
          totalAlerts: { $sum: 1 },
          resolvedAlerts: { $sum: { $cond: ['$processed', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalAlerts: alertsBySeverity.reduce((sum, item) => sum + item.count, 0),
          deviceCount: devices.length,
          period: { start, end }
        },
        alertsBySeverity,
        alertsByDevice,
        alertTrends,
        recentCriticalAlerts,
        alertResolution
      }
    });

  } catch (error) {
    logger.error('Get alerts analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 */
router.get('/export', authenticate, validate(querySchemas.dateRange, 'query'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, format = 'json', sensorType } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const devices = await Device.find({ userId, isActive: true });
    const deviceIds = devices.map(d => d.deviceId);

    // Строим запрос - используем deviceId
    const query = {
      deviceId: { $in: deviceIds },
      createdAt: { $gte: start, $lte: end }
    };

    if (sensorType) {
      query.sensorType = sensorType;
    }

    const data = await SensorData.find(query)
      .sort({ createdAt: -1 })
      .limit(10000) // Ограничиваем, чтобы предотвратить большие экспорты
      .select('deviceId sensorType data alertLevel createdAt processingResult.trend');

    // Форматируем данные для экспорта
    const exportData = {
      metadata: {
        exportedAt: new Date(),
        period: { start, end },
        deviceCount: devices.length,
        recordCount: data.length,
        userId: userId.toString()
      },
      devices: devices.map(d => ({
        deviceId: d.deviceId,
        name: d.name,
        location: d.location,
        deviceType: d.deviceType
      })),
      data
    };

    if (format === 'csv') {
      // Конвертируем в CSV формат (упрощенный)
      const csv = [
        'timestamp,deviceId,sensorType,temperature,humidity,motionDetected,location,alertLevel',
        ...data.map(record => [
          record.createdAt.toISOString(),
          record.deviceId,
          record.sensorType,
          record.data.temperature || '',
          record.data.humidity || '',
          record.data.motionDetected || '',
          record.data.location || '',
          record.alertLevel
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.json"`);
      res.json(exportData);
    }

    logger.info(`Analytics data exported for user ${userId}`, {
      format,
      recordCount: data.length,
      period: { start, end }
    });

  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

module.exports = router;