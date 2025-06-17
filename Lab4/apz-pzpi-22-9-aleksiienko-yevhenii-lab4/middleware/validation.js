const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    req[property] = value;
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    phone: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    phone: Joi.string().optional(),
    timezone: Joi.string().optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        temperature_alerts: Joi.boolean().optional(),
        motion_alerts: Joi.boolean().optional()
      }).optional(),
      thresholds: Joi.object({
        temperature_warning: Joi.number().min(-50).max(100).optional(),
        temperature_critical: Joi.number().min(-50).max(100).optional()
      }).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

// Device validation schemas
const deviceSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500).optional(),
    location: Joi.string().max(100).required(),
    deviceType: Joi.string().valid('monitoring_station', 'sensor_hub', 'smart_home').optional(),
    configuration: Joi.object({
      sensors: Joi.object({
        temperature: Joi.object({
          enabled: Joi.boolean().optional(),
          interval: Joi.number().min(1000).max(300000).optional(),
          thresholds: Joi.object({
            warning: Joi.number().min(-50).max(100).optional(),
            critical: Joi.number().min(-50).max(100).optional()
          }).optional()
        }).optional(),
        motion: Joi.object({
          enabled: Joi.boolean().optional(),
          sensitivity: Joi.string().valid('low', 'medium', 'high').optional(),
          zones: Joi.array().items(
            Joi.object({
              id: Joi.number().required(),
              name: Joi.string().required(),
              enabled: Joi.boolean().optional()
            })
          ).optional()
        }).optional()
      }).optional(),
      alerts: Joi.object({
        sound: Joi.boolean().optional(),
        frequency: Joi.number().min(1000).max(10000).optional()
      }).optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(500).optional(),
    location: Joi.string().max(100).optional(),
    configuration: Joi.object({
      sensors: Joi.object({
        temperature: Joi.object({
          enabled: Joi.boolean().optional(),
          interval: Joi.number().min(1000).max(300000).optional(),
          thresholds: Joi.object({
            warning: Joi.number().min(-50).max(100).optional(),
            critical: Joi.number().min(-50).max(100).optional()
          }).optional()
        }).optional(),
        motion: Joi.object({
          enabled: Joi.boolean().optional(),
          sensitivity: Joi.string().valid('low', 'medium', 'high').optional(),
          zones: Joi.array().items(
            Joi.object({
              id: Joi.number().required(),
              name: Joi.string().required(),
              enabled: Joi.boolean().optional()
            })
          ).optional()
        }).optional()
      }).optional(),
      alerts: Joi.object({
        sound: Joi.boolean().optional(),
        frequency: Joi.number().min(1000).max(10000).optional()
      }).optional()
    }).optional(),
    isActive: Joi.boolean().optional()
  })
};

// Sensor data validation schemas
const sensorDataSchemas = {
  create: Joi.object({
    deviceId: Joi.string().pattern(/^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/).required(),
    sensorType: Joi.string().valid('temperature', 'motion', 'humidity', 'system').required(),
    data: Joi.object({
      temperature: Joi.number().min(-50).max(100).optional(),
      humidity: Joi.number().min(0).max(100).optional(),
      motionDetected: Joi.boolean().optional(),
      sensorId: Joi.number().optional(),
      location: Joi.string().optional(),
      battery: Joi.number().min(0).max(100).optional(),
      signalStrength: Joi.number().min(-100).max(0).optional(),
      memory: Joi.object({
        used: Joi.number().optional(),
        free: Joi.number().optional()
      }).optional(),
      uptime: Joi.number().optional()
    }).required(),
    alertLevel: Joi.string().valid('info', 'warning', 'critical', 'normal').optional(),
    metadata: Joi.object({
      firmware: Joi.string().optional(),
      deviceTimestamp: Joi.number().optional(),
      dataQuality: Joi.string().valid('excellent', 'good', 'poor', 'invalid').optional()
    }).optional()
  })
};

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('-createdAt')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    period: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
  }),

  deviceFilter: Joi.object({
    deviceId: Joi.string().optional(),
    sensorType: Joi.string().valid('temperature', 'motion', 'humidity', 'system').optional(),
    alertLevel: Joi.string().valid('info', 'warning', 'critical', 'normal').optional(),
    isOnline: Joi.boolean().optional()
  })
};

// Device ID validation
const validateDeviceId = (req, res, next) => {
  const { deviceId } = req.params;
  const deviceIdPattern = /^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/;
  
  if (!deviceIdPattern.test(deviceId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid device ID format. Expected: YYYYMMDD-userID-5randmSymbols'
    });
  }
  
  next();
};

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Remove potential MongoDB operators
          obj[key] = obj[key].replace(/^\$/, '');
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};

module.exports = {
  validate,
  userSchemas,
  deviceSchemas,
  sensorDataSchemas,
  querySchemas,
  validateDeviceId,
  validateObjectId,
  sanitizeInput
};