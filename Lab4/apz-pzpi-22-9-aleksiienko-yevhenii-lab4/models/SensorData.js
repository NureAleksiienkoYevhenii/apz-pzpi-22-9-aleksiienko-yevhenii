const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    ref: 'Device'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sensorType: {
    type: String,
    enum: ['temperature', 'motion', 'humidity', 'system'],
    required: true
  },
  data: {
    // Temperature sensor data
    temperature: {
      type: Number,
      min: -50,
      max: 100
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Motion sensor data
    motionDetected: {
      type: Boolean
    },
    sensorId: {
      type: Number
    },
    location: {
      type: String,
      trim: true
    },
    
    // System data
    battery: {
      type: Number,
      min: 0,
      max: 100
    },
    signalStrength: {
      type: Number,
      min: -100,
      max: 0
    },
    memory: {
      used: Number,
      free: Number
    },
    uptime: {
      type: Number
    }
  },
  alertLevel: {
    type: String,
    enum: ['info', 'warning', 'critical', 'normal'],
    default: 'normal'
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingResult: {
    anomaly: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    recommendations: [{
      type: String,
      maxlength: 500
    }],
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable', 'volatile']
    }
  },
  metadata: {
    firmware: {
      type: String
    },
    deviceTimestamp: {
      type: Number
    },
    processingTime: {
      type: Number // milliseconds
    },
    dataQuality: {
      type: String,
      enum: ['excellent', 'good', 'poor', 'invalid'],
      default: 'good'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
sensorDataSchema.index({ deviceId: 1, createdAt: -1 });
sensorDataSchema.index({ userId: 1, createdAt: -1 });
sensorDataSchema.index({ sensorType: 1, createdAt: -1 });
sensorDataSchema.index({ alertLevel: 1, createdAt: -1 });
sensorDataSchema.index({ processed: 1 });
sensorDataSchema.index({ 
  deviceId: 1, 
  sensorType: 1, 
  createdAt: -1 
});

// TTL index for automatic data cleanup (optional - remove old data after 1 year)
sensorDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for getting human-readable timestamp
sensorDataSchema.virtual('readableTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to mark as processed
sensorDataSchema.methods.markProcessed = function(result = {}) {
  this.processed = true;
  this.processingResult = { ...this.processingResult, ...result };
  return this.save();
};

// Static method to get latest data by device and sensor type
sensorDataSchema.statics.getLatest = function(deviceId, sensorType, limit = 1) {
  return this.find({ deviceId, sensorType })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get data in time range
sensorDataSchema.statics.getInTimeRange = function(deviceId, startDate, endDate, sensorType = null) {
  const query = {
    deviceId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (sensorType) {
    query.sensorType = sensorType;
  }
  
  return this.find(query).sort({ createdAt: 1 });
};

// Static method to get unprocessed data
sensorDataSchema.statics.getUnprocessed = function(limit = 100) {
  return this.find({ processed: false })
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Static method to get alerts
sensorDataSchema.statics.getAlerts = function(deviceId = null, alertLevel = null, limit = 50) {
  const query = {};
  
  if (deviceId) query.deviceId = deviceId;
  if (alertLevel) query.alertLevel = alertLevel;
  else query.alertLevel = { $in: ['warning', 'critical'] };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method for analytics aggregation
sensorDataSchema.statics.getAggregatedData = function(deviceId, sensorType, period = 'hour') {
  const groupBy = {
    hour: {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
      hour: { $hour: '$createdAt' }
    },
    day: {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' }
    },
    week: {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' }
    },
    month: {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    }
  };

  return this.aggregate([
    {
      $match: {
        deviceId,
        sensorType,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: groupBy[period],
        avgTemperature: { $avg: '$data.temperature' },
        maxTemperature: { $max: '$data.temperature' },
        minTemperature: { $min: '$data.temperature' },
        avgHumidity: { $avg: '$data.humidity' },
        motionCount: { $sum: { $cond: ['$data.motionDetected', 1, 0] } },
        alertCount: { 
          $sum: { 
            $cond: [{ $in: ['$alertLevel', ['warning', 'critical']] }, 1, 0] 
          } 
        },
        dataPoints: { $sum: 1 },
        timestamp: { $first: '$createdAt' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);
};

module.exports = mongoose.model('SensorData', sensorDataSchema);