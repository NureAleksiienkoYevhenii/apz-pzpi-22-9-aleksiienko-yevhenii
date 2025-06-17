const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const aiService = require('./aiService');
const logger = require('../utils/logger');

class MQTTService {
  constructor() {
    this.client = null;
    this.io = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  initialize(socketIO) {
    this.io = socketIO;
    this.connect();
  }

  connect() {
    try {
      const brokerUrl = `mqtt://${mqttConfig.broker}:${mqttConfig.port}`;
      logger.info(`Connecting to MQTT broker: ${brokerUrl}`);

      this.client = mqtt.connect(brokerUrl, mqttConfig.options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('Connected to MQTT broker');
        this.subscribeToTopics();
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('MQTT connection closed');
        this.handleReconnect();
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        logger.warn('MQTT client offline');
      });

    } catch (error) {
      logger.error('Failed to connect to MQTT broker:', error);
      this.handleReconnect();
    }
  }

  subscribeToTopics() {
    const topics = [
      mqttConfig.topics.deviceTemperature,
      mqttConfig.topics.deviceMotion,
      mqttConfig.topics.deviceStatus
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: mqttConfig.qos.subscribe }, (error) => {
        if (error) {
          logger.error(`Failed to subscribe to topic ${topic}:`, error);
        } else {
          logger.info(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  async handleMessage(topic, message) {
    try {
      const messageString = message.toString();
      
      // Skip non-JSON messages (like "offline", "online", etc.)
      if (!messageString.startsWith('{') && !messageString.startsWith('[')) {
        logger.info(`Received non-JSON message on topic ${topic}: ${messageString}`);
        return;
      }

      const data = JSON.parse(messageString);
      const deviceId = this.extractDeviceIdFromTopic(topic);
      
      if (!deviceId) {
        logger.error('Could not extract device ID from topic:', topic);
        return;
      }

      // Validate device ID format
      if (!this.isValidDeviceId(deviceId)) {
        logger.warn(`Invalid device ID format: ${deviceId}, skipping message`);
        return;
      }

      logger.info(`Received message from device ${deviceId}:`, data);

      // Update device last seen
      await this.updateDeviceStatus(deviceId);

      // Process based on topic type
      if (topic.includes('/temperature')) {
        await this.handleTemperatureData(deviceId, data);
      } else if (topic.includes('/motion')) {
        await this.handleMotionData(deviceId, data);
      } else if (topic.includes('/status')) {
        await this.handleStatusData(deviceId, data);
      }

      // Emit real-time data to connected clients
      this.emitToDevice(deviceId, {
        topic,
        data,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  async handleTemperatureData(deviceId, data) {
    try {
      // Find device to get userId
      const device = await Device.findOne({ deviceId });
      if (!device) {
        logger.warn(`Temperature data received for unknown device: ${deviceId}. Device may not be registered.`);
        return;
      }

      // Create sensor data record
      const sensorData = new SensorData({
        deviceId,
        userId: device.userId,
        sensorType: 'temperature',
        data: {
          temperature: data.temperature,
          humidity: data.humidity || null
        },
        alertLevel: data.alert_level || 'normal',
        metadata: {
          deviceTimestamp: data.timestamp,
          firmware: device.firmware?.version
        }
      });

      await sensorData.save();

      // Check for temperature alerts
      if (data.alert_level === 'critical' || data.alert_level === 'warning') {
        await device.incrementAlerts();
        await this.sendAlert(deviceId, {
          type: 'temperature',
          level: data.alert_level,
          temperature: data.temperature,
          threshold: data.alert_level === 'critical' ? 
            device.configuration.sensors.temperature.thresholds.critical :
            device.configuration.sensors.temperature.thresholds.warning
        });
      }

      // Process with AI for recommendations
      await aiService.processSensorData(sensorData);

      logger.info(`Temperature data processed for device ${deviceId}`);

    } catch (error) {
      logger.error('Error handling temperature data:', error);
    }
  }

  async handleMotionData(deviceId, data) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        logger.warn(`Motion data received for unknown device: ${deviceId}. Device may not be registered.`);
        return;
      }

      const sensorData = new SensorData({
        deviceId,
        userId: device.userId,
        sensorType: 'motion',
        data: {
          motionDetected: data.motion_detected,
          sensorId: data.sensor_id,
          location: data.location
        },
        alertLevel: data.alert_level || 'info',
        metadata: {
          deviceTimestamp: data.timestamp,
          firmware: device.firmware?.version
        }
      });

      await sensorData.save();

      // Send motion alert
      if (data.motion_detected) {
        await this.sendAlert(deviceId, {
          type: 'motion',
          level: 'info',
          location: data.location,
          sensorId: data.sensor_id
        });
      }

      logger.info(`Motion data processed for device ${deviceId}`);

    } catch (error) {
      logger.error('Error handling motion data:', error);
    }
  }

  async handleStatusData(deviceId, data) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        logger.warn(`Status data received for unknown device: ${deviceId}. Device may not be registered.`);
        return;
      }

      // Update device status
      device.status.battery = data.battery || device.status.battery;
      device.status.wifi.signalStrength = data.signalStrength || device.status.wifi.signalStrength;
      device.status.memory = data.memory || device.status.memory;
      
      await device.save();

      // Create status data record
      const sensorData = new SensorData({
        deviceId,
        userId: device.userId,
        sensorType: 'system',
        data: {
          battery: data.battery,
          signalStrength: data.signalStrength,
          memory: data.memory,
          uptime: data.uptime
        },
        alertLevel: 'info',
        metadata: {
          deviceTimestamp: data.timestamp,
          firmware: device.firmware?.version
        }
      });

      await sensorData.save();

      logger.info(`Status data processed for device ${deviceId}`);

    } catch (error) {
      logger.error('Error handling status data:', error);
    }
  }

  async updateDeviceStatus(deviceId) {
    try {
      const result = await Device.findOneAndUpdate(
        { deviceId },
        {
          'status.lastSeen': new Date(),
          'status.isOnline': true
        }
      );
      
      if (!result) {
        logger.debug(`Device status update skipped for unknown device: ${deviceId}`);
      }
    } catch (error) {
      logger.error('Error updating device status:', error);
    }
  }

  async sendAlert(deviceId, alertData) {
    try {
      // Emit alert to connected clients
      this.emitToDevice(deviceId, {
        type: 'alert',
        data: alertData,
        timestamp: new Date()
      });

      // Could also send push notifications, emails, etc.
      logger.info(`Alert sent for device ${deviceId}:`, alertData);

    } catch (error) {
      logger.error('Error sending alert:', error);
    }
  }

  sendCommand(deviceId, command) {
    if (!this.isConnected) {
      logger.error('MQTT client not connected');
      return false;
    }

    const topic = `devices/${deviceId}/commands`;
    const message = JSON.stringify(command);

    this.client.publish(topic, message, { qos: mqttConfig.qos.publish }, (error) => {
      if (error) {
        logger.error(`Failed to send command to device ${deviceId}:`, error);
      } else {
        logger.info(`Command sent to device ${deviceId}:`, command);
      }
    });

    return true;
  }

  emitToDevice(deviceId, data) {
    if (this.io) {
      this.io.to(`device_${deviceId}`).emit('device_data', data);
    }
  }

  extractDeviceIdFromTopic(topic) {
    // Extract device ID from topic pattern: devices/{deviceId}/...
    const parts = topic.split('/');
    if (parts.length >= 3 && parts[0] === 'devices') {
      return parts[1];
    }
    return null;
  }

  isValidDeviceId(deviceId) {
    // Check if device ID matches our format: YYYYMMDD-userID-5randmSymbols
    const deviceIdPattern = /^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/;
    return deviceIdPattern.test(deviceId);
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      logger.info(`Attempting to reconnect to MQTT broker in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached. Manual intervention required.');
    }
  }

  // Monitor for stale devices (devices that haven't sent data recently)
  startDeviceMonitoring() {
    setInterval(async () => {
      try {
        const staleDevices = await Device.findStale(10); // 10 minutes
        
        for (const device of staleDevices) {
          await device.markOffline();
          this.emitToDevice(device.deviceId, {
            type: 'device_offline',
            deviceId: device.deviceId,
            lastSeen: device.status.lastSeen
          });
          
          logger.warn(`Device marked as offline: ${device.deviceId}`);
        }
      } catch (error) {
        logger.error('Error in device monitoring:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  getStatus() {
    return {
      connected: this.isConnected,
      broker: mqttConfig.broker,
      port: mqttConfig.port,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      logger.info('MQTT client disconnected');
    }
  }
}

// Create singleton instance
const mqttService = new MQTTService();

module.exports = mqttService;