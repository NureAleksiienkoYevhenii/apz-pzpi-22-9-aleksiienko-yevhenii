const crypto = require('crypto');
const Device = require('../models/Device');

class DeviceGenerator {
  /**
   * Generate unique device ID in format: YYYYMMDD-userID-5randmSymbols
   * @param {string} userId - User ID
   * @returns {string} Generated device ID
   */
  static generateDeviceId(userId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const datePrefix = `${year}${month}${day}`;
    const randomSuffix = this.generateRandomString(5);
    
    return `${datePrefix}-${userId}-${randomSuffix}`;
  }

  /**
   * Generate unique device ID with collision check
   * @param {string} userId - User ID
   * @returns {Promise<string>} Unique device ID
   */
  static async generateUniqueDeviceId(userId) {
    let deviceId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      deviceId = this.generateDeviceId(userId);
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique device ID after maximum attempts');
      }
      
      // Check if device ID already exists
      const existingDevice = await Device.findOne({ deviceId });
      if (!existingDevice) {
        break;
      }
    } while (attempts <= maxAttempts);

    return deviceId;
  }

  /**
   * Generate random alphanumeric string
   * @param {number} length - Length of the string
   * @returns {string} Random string
   */
  static generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Validate device ID format
   * @param {string} deviceId - Device ID to validate
   * @returns {boolean} True if valid format
   */
  static validateDeviceIdFormat(deviceId) {
    const pattern = /^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/;
    return pattern.test(deviceId);
  }

  /**
   * Extract information from device ID
   * @param {string} deviceId - Device ID
   * @returns {object} Extracted information
   */
  static parseDeviceId(deviceId) {
    if (!this.validateDeviceIdFormat(deviceId)) {
      throw new Error('Invalid device ID format');
    }

    const parts = deviceId.split('-');
    const datePart = parts[0];
    const userId = parts[1];
    const randomPart = parts[2];

    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6));
    const day = parseInt(datePart.substring(6, 8));

    return {
      dateCreated: new Date(year, month - 1, day),
      userId,
      randomSuffix: randomPart,
      year,
      month,
      day
    };
  }

  /**
   * Generate batch of device IDs for testing
   * @param {string} userId - User ID
   * @param {number} count - Number of device IDs to generate
   * @returns {Promise<string[]>} Array of unique device IDs
   */
  static async generateBatch(userId, count = 1) {
    const deviceIds = [];
    
    for (let i = 0; i < count; i++) {
      const deviceId = await this.generateUniqueDeviceId(userId);
      deviceIds.push(deviceId);
    }
    
    return deviceIds;
  }

  /**
   * Check if device ID belongs to specific date
   * @param {string} deviceId - Device ID
   * @param {Date} date - Date to check
   * @returns {boolean} True if device ID is from the specified date
   */
  static isFromDate(deviceId, date) {
    try {
      const parsed = this.parseDeviceId(deviceId);
      const deviceDate = parsed.dateCreated;
      
      return (
        deviceDate.getFullYear() === date.getFullYear() &&
        deviceDate.getMonth() === date.getMonth() &&
        deviceDate.getDate() === date.getDate()
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get devices created in date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Devices in date range
   */
  static async getDevicesInDateRange(startDate, endDate) {
    const allDevices = await Device.find({}, 'deviceId name location userId');
    
    return allDevices.filter(device => {
      try {
        const parsed = this.parseDeviceId(device.deviceId);
        const deviceDate = parsed.dateCreated;
        
        return deviceDate >= startDate && deviceDate <= endDate;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Generate default device configuration
   * @param {string} deviceType - Type of device
   * @returns {object} Default configuration
   */
  static generateDefaultConfiguration(deviceType = 'monitoring_station') {
    const baseConfig = {
      sensors: {
        temperature: {
          enabled: true,
          interval: 5000,
          thresholds: {
            warning: 38.0,
            critical: 40.0
          }
        },
        motion: {
          enabled: true,
          sensitivity: 'medium',
          zones: [
            { id: 1, name: 'Kitchen', enabled: true },
            { id: 2, name: 'Living Room', enabled: true },
            { id: 3, name: 'Corridor', enabled: true }
          ]
        }
      },
      alerts: {
        sound: true,
        frequency: 7000
      }
    };

    // Customize based on device type
    switch (deviceType) {
      case 'sensor_hub':
        baseConfig.sensors.temperature.interval = 10000;
        baseConfig.sensors.motion.sensitivity = 'high';
        break;
      case 'smart_home':
        baseConfig.sensors.temperature.thresholds.warning = 35.0;
        baseConfig.sensors.temperature.thresholds.critical = 45.0;
        break;
    }

    return baseConfig;
  }

  /**
   * Generate device statistics template
   * @returns {object} Statistics template
   */
  static generateDefaultStatistics() {
    return {
      totalUptime: 0,
      totalAlerts: 0,
      lastReboot: new Date(),
      dataPoints: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    };
  }

  /**
   * Generate device status template
   * @returns {object} Status template
   */
  static generateDefaultStatus() {
    return {
      isOnline: false,
      lastSeen: new Date(),
      battery: {
        level: 100,
        isCharging: false
      },
      wifi: {
        connected: false,
        signalStrength: -50,
        ssid: ''
      },
      memory: {
        used: 0,
        free: 1024
      }
    };
  }

  /**
   * Generate QR code data for device registration
   * @param {string} deviceId - Device ID
   * @param {object} additionalData - Additional data for QR code
   * @returns {string} QR code data string
   */
  static generateQRCodeData(deviceId, additionalData = {}) {
    const qrData = {
      deviceId,
      type: 'device_registration',
      timestamp: Date.now(),
      ...additionalData
    };

    return JSON.stringify(qrData);
  }

  /**
   * Validate and parse QR code data
   * @param {string} qrCodeData - QR code data string
   * @returns {object} Parsed QR code data
   */
  static parseQRCodeData(qrCodeData) {
    try {
      const data = JSON.parse(qrCodeData);
      
      if (!data.deviceId || !this.validateDeviceIdFormat(data.deviceId)) {
        throw new Error('Invalid device ID in QR code');
      }
      
      if (data.type !== 'device_registration') {
        throw new Error('Invalid QR code type');
      }
      
      return data;
    } catch (error) {
      throw new Error('Invalid QR code data format');
    }
  }
}

module.exports = DeviceGenerator;