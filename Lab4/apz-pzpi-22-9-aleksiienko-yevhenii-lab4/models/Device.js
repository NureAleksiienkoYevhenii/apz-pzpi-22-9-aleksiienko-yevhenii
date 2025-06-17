const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    // Format: YYYYMMDD-userID-5randmSymbols
    match: /^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  deviceType: {
    type: String,
    enum: ['monitoring_station', 'sensor_hub', 'smart_home'],
    default: 'monitoring_station'
  },
  firmware: {
    version: {
      type: String,
      default: '1.0.0'
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  configuration: {
    sensors: {
      temperature: {
        enabled: {
          type: Boolean,
          default: true
        },
        interval: {
          type: Number,
          default: 5000, // milliseconds
          min: 1000,
          max: 300000
        },
        thresholds: {
          warning: {
            type: Number,
            default: 38.0
          },
          critical: {
            type: Number,
            default: 40.0
          }
        }
      },
      motion: {
        enabled: {
          type: Boolean,
          default: true
        },
        sensitivity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        zones: [{
          id: {
            type: Number,
            required: true
          },
          name: {
            type: String,
            required: true
          },
          enabled: {
            type: Boolean,
            default: true
          }
        }]
      }
    },
    alerts: {
      sound: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: Number,
        default: 7000, // Hz
        min: 1000,
        max: 10000
      }
    }
  },
  status: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    battery: {
      level: {
        type: Number,
        min: 0,
        max: 100
      },
      isCharging: {
        type: Boolean,
        default: false
      }
    },
    wifi: {
      connected: {
        type: Boolean,
        default: false
      },
      signalStrength: {
        type: Number,
        min: -100,
        max: 0
      },
      ssid: {
        type: String,
        trim: true
      }
    },
    memory: {
      used: {
        type: Number
      },
      free: {
        type: Number
      }
    }
  },
  statistics: {
    totalUptime: {
      type: Number,
      default: 0 // seconds
    },
    totalAlerts: {
      type: Number,
      default: 0
    },
    lastReboot: {
      type: Date
    },
    dataPoints: {
      today: {
        type: Number,
        default: 0
      },
      thisWeek: {
        type: Number,
        default: 0
      },
      thisMonth: {
        type: Number,
        default: 0
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes (убираем дублированный индекс deviceId так как он уже unique: true)
deviceSchema.index({ userId: 1 });
deviceSchema.index({ 'status.isOnline': 1 });
deviceSchema.index({ isActive: 1 });
deviceSchema.index({ createdAt: -1 });

// Virtual for getting device age
deviceSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to update last seen
deviceSchema.methods.updateLastSeen = function() {
  this.status.lastSeen = new Date();
  this.status.isOnline = true;
  return this.save();
};

// Method to mark device as offline
deviceSchema.methods.markOffline = function() {
  this.status.isOnline = false;
  return this.save();
};

// Method to increment alert count
deviceSchema.methods.incrementAlerts = function() {
  this.statistics.totalAlerts += 1;
  return this.save();
};

// Static method to find online devices
deviceSchema.statics.findOnline = function() {
  return this.find({ 'status.isOnline': true, isActive: true });
};

// Static method to find devices by user
deviceSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isActive: true });
};

// Static method to find devices that haven't been seen recently
deviceSchema.statics.findStale = function(minutes = 10) {
  const staleTime = new Date(Date.now() - minutes * 60 * 1000);
  return this.find({
    'status.lastSeen': { $lt: staleTime },
    'status.isOnline': true,
    isActive: true
  });
};

module.exports = mongoose.model('Device', deviceSchema);