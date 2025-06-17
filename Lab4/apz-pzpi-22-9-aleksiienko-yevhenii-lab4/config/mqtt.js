module.exports = {
  broker: process.env.MQTT_BROKER || 'broker.hivemq.com',
  port: parseInt(process.env.MQTT_PORT) || 1883,
  options: {
    clientId: `smart_monitoring_server_${Math.random().toString(16).substr(2, 8)}`,
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
  },
  topics: {
    // Pattern for device topics
    deviceTemperature: 'devices/+/temperature',
    deviceMotion: 'devices/+/motion',
    deviceStatus: 'devices/+/status',
    deviceCommands: 'devices/+/commands',
    
    // System topics
    systemStatus: 'system/status',
    systemAlerts: 'system/alerts'
  },
  qos: {
    subscribe: 1,
    publish: 1
  }
};