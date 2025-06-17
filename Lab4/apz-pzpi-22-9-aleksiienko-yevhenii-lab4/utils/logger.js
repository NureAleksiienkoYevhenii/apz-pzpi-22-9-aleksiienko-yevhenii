const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'smart-monitoring-server'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // File output for errors
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File output for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log')
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add request logging utility
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    };
    
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, logData);
    } else {
      logger.info(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, logData);
    }
  });
  
  if (next) next();
};

// Add structured logging methods
logger.logError = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context
  });
};

logger.logWarning = (message, context = {}) => {
  logger.warn(message, { context });
};

logger.logInfo = (message, context = {}) => {
  logger.info(message, { context });
};

logger.logDebug = (message, context = {}) => {
  logger.debug(message, { context });
};

// Device-specific logging
logger.logDeviceEvent = (deviceId, event, data = {}) => {
  logger.info(`Device Event - ${deviceId}: ${event}`, {
    deviceId,
    event,
    data,
    timestamp: new Date().toISOString()
  });
};

// MQTT-specific logging
logger.logMQTT = (action, topic, data = {}) => {
  logger.info(`MQTT ${action} - ${topic}`, {
    action,
    topic,
    data,
    timestamp: new Date().toISOString()
  });
};

// Performance logging
logger.logPerformance = (operation, duration, context = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`Performance - ${operation}: ${duration}ms`, {
    operation,
    duration,
    context,
    timestamp: new Date().toISOString()
  });
};

// Security logging
logger.logSecurity = (event, userId = null, ip = null, details = {}) => {
  logger.warn(`Security Event - ${event}`, {
    event,
    userId,
    ip,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;