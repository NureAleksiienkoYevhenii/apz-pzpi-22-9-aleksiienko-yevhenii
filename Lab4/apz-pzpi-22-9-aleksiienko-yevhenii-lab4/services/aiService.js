const Anthropic = require('@anthropic-ai/sdk');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.isEnabled = !!process.env.ANTHROPIC_API_KEY;
    
    if (!this.isEnabled) {
      logger.warn('AI Service disabled: ANTHROPIC_API_KEY not provided');
    }
  }

  async processSensorData(sensorData) {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Get historical data for context
      const historicalData = await this.getHistoricalContext(sensorData.deviceId, sensorData.sensorType);
      
      // Analyze based on sensor type
      let analysis;
      switch (sensorData.sensorType) {
        case 'temperature':
          analysis = await this.analyzeTemperatureData(sensorData, historicalData);
          break;
        case 'motion':
          analysis = await this.analyzeMotionData(sensorData, historicalData);
          break;
        default:
          logger.info(`AI analysis not implemented for sensor type: ${sensorData.sensorType}`);
          return;
      }

      // Update sensor data with AI analysis results
      await sensorData.markProcessed(analysis);
      
      logger.info(`AI analysis completed for sensor data ${sensorData._id}`);
      
    } catch (error) {
      logger.error('Error in AI processing:', error);
    }
  }

  async analyzeTemperatureData(sensorData, historicalData) {
    try {
      const device = await Device.findOne({ deviceId: sensorData.deviceId });
      const currentTemp = sensorData.data.temperature;
      const currentHumidity = sensorData.data.humidity;
      
      // Prepare context for AI
      const context = this.prepareTemperatureContext(currentTemp, currentHumidity, historicalData, device);
      
      const prompt = `
Analyze this temperature monitoring data and provide insights:

Current Reading:
- Temperature: ${currentTemp}°C
- Humidity: ${currentHumidity || 'N/A'}%
- Alert Level: ${sensorData.alertLevel}
- Location: ${device.location}
- Device: ${device.name}

Historical Context (last 24 hours):
${context.historical}

Device Configuration:
- Warning Threshold: ${device.configuration.sensors.temperature.thresholds.warning}°C
- Critical Threshold: ${device.configuration.sensors.temperature.thresholds.critical}°C

Please provide:
1. Anomaly detection (true/false) with confidence level (0-1)
2. Trend analysis (increasing/decreasing/stable/volatile)
3. Up to 3 practical recommendations
4. Risk assessment

Respond in JSON format:
{
  "anomaly": boolean,
  "confidence": number,
  "trend": "string",
  "recommendations": ["string1", "string2", "string3"],
  "riskLevel": "low|medium|high",
  "summary": "brief analysis summary"
}`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const analysis = JSON.parse(response.content[0].text);
      
      return {
        anomaly: analysis.anomaly,
        confidence: analysis.confidence,
        recommendations: analysis.recommendations,
        trend: analysis.trend,
        riskLevel: analysis.riskLevel,
        summary: analysis.summary
      };

    } catch (error) {
      logger.error('Error in temperature AI analysis:', error);
      return this.getDefaultAnalysis();
    }
  }

  async analyzeMotionData(sensorData, historicalData) {
    try {
      const device = await Device.findOne({ deviceId: sensorData.deviceId });
      const motionDetected = sensorData.data.motionDetected;
      const location = sensorData.data.location;
      
      // Get motion patterns from historical data
      const motionPatterns = this.analyzeMotionPatterns(historicalData);
      
      const prompt = `
Analyze this motion detection data for security and behavioral patterns:

Current Reading:
- Motion Detected: ${motionDetected}
- Location: ${location}
- Time: ${sensorData.createdAt}
- Device: ${device.name} at ${device.location}

Motion Patterns (last 7 days):
${motionPatterns}

Please provide:
1. Pattern analysis (normal/unusual)
2. Security risk assessment
3. Behavioral insights
4. Recommendations for optimization

Respond in JSON format:
{
  "anomaly": boolean,
  "confidence": number,
  "pattern": "normal|unusual|suspicious",
  "recommendations": ["string1", "string2"],
  "securityRisk": "low|medium|high",
  "insights": "behavioral analysis"
}`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const analysis = JSON.parse(response.content[0].text);
      
      return {
        anomaly: analysis.anomaly,
        confidence: analysis.confidence,
        recommendations: analysis.recommendations,
        pattern: analysis.pattern,
        securityRisk: analysis.securityRisk,
        insights: analysis.insights
      };

    } catch (error) {
      logger.error('Error in motion AI analysis:', error);
      return this.getDefaultAnalysis();
    }
  }

  async generateDeviceReport(deviceId, timeRange = '24h') {
    if (!this.isEnabled) {
      throw new Error('AI Service is not available');
    }

    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        throw new Error('Device not found');
      }

      // Get comprehensive data for the time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1);
      }

      const sensorData = await SensorData.getInTimeRange(deviceId, startDate, endDate);
      const aggregatedData = await SensorData.getAggregatedData(deviceId, 'temperature', 'hour');
      
      const dataContext = this.prepareReportContext(sensorData, aggregatedData, device);

      const prompt = `
Generate a comprehensive monitoring report for smart home device:

Device Information:
- Name: ${device.name}
- Location: ${device.location}
- Type: ${device.deviceType}
- Time Range: ${timeRange}

Data Summary:
${dataContext}

Please provide a detailed report including:
1. Executive summary
2. Key findings and insights
3. Performance metrics
4. Anomalies and alerts
5. Recommendations for optimization
6. Predictive insights
7. Security assessment

Format as a professional monitoring report.`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      return {
        deviceId,
        timeRange,
        generatedAt: new Date(),
        report: response.content[0].text
      };

    } catch (error) {
      logger.error('Error generating device report:', error);
      throw error;
    }
  }

  async getRecommendations(userId, deviceIds = null) {
    if (!this.isEnabled) {
      return [];
    }

    try {
      // Get user's devices and recent data
      const devices = deviceIds ? 
        await Device.find({ deviceId: { $in: deviceIds }, userId }) :
        await Device.findByUser(userId);

      if (devices.length === 0) {
        return [];
      }

      // Get recent data for analysis
      const recentData = await SensorData.find({
        deviceId: { $in: devices.map(d => d.deviceId) },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).limit(100);

      const context = this.prepareRecommendationContext(devices, recentData);

      const prompt = `
Based on the smart home monitoring data, provide personalized recommendations:

User Profile:
- Number of devices: ${devices.length}
- Locations: ${devices.map(d => d.location).join(', ')}

Recent Activity Summary:
${context}

Please provide 3-5 actionable recommendations to:
1. Improve energy efficiency
2. Enhance security
3. Optimize comfort
4. Prevent issues
5. Improve device performance

Respond in JSON format:
{
  "recommendations": [
    {
      "category": "string",
      "priority": "high|medium|low",
      "title": "string",
      "description": "string",
      "action": "string"
    }
  ]
}`;

      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const result = JSON.parse(response.content[0].text);
      return result.recommendations || [];

    } catch (error) {
      logger.error('Error getting AI recommendations:', error);
      return [];
    }
  }

  async getHistoricalContext(deviceId, sensorType) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    return await SensorData.getInTimeRange(deviceId, startDate, endDate, sensorType);
  }

  prepareTemperatureContext(currentTemp, currentHumidity, historicalData, device) {
    const temps = historicalData
      .filter(d => d.data.temperature != null)
      .map(d => d.data.temperature);
    
    if (temps.length === 0) {
      return { historical: 'No historical data available' };
    }

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    
    const alerts = historicalData.filter(d => d.alertLevel !== 'normal').length;

    return {
      historical: `Average: ${avgTemp.toFixed(1)}°C, Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C, Alerts: ${alerts}`
    };
  }

  analyzeMotionPatterns(historicalData) {
    const motionEvents = historicalData.filter(d => d.data.motionDetected);
    const totalEvents = motionEvents.length;
    
    if (totalEvents === 0) {
      return 'No motion events in the analyzed period';
    }

    // Group by hour to find patterns
    const hourlyPattern = {};
    motionEvents.forEach(event => {
      const hour = event.createdAt.getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
    });

    const peakHour = Object.keys(hourlyPattern).reduce((a, b) => 
      hourlyPattern[a] > hourlyPattern[b] ? a : b
    );

    return `Total events: ${totalEvents}, Peak activity: ${peakHour}:00, Average per day: ${(totalEvents / 7).toFixed(1)}`;
  }

  prepareReportContext(sensorData, aggregatedData, device) {
    const temperatureData = sensorData.filter(d => d.sensorType === 'temperature');
    const motionData = sensorData.filter(d => d.sensorType === 'motion');
    const alerts = sensorData.filter(d => d.alertLevel !== 'normal');

    return `
Temperature readings: ${temperatureData.length}
Motion events: ${motionData.length}
Total alerts: ${alerts.length}
Device uptime: ${device.statistics.totalUptime} seconds
Last seen: ${device.status.lastSeen}
Battery level: ${device.status.battery?.level || 'N/A'}%
`;
  }

  prepareRecommendationContext(devices, recentData) {
    const onlineDevices = devices.filter(d => d.status.isOnline).length;
    const totalAlerts = recentData.filter(d => d.alertLevel !== 'normal').length;
    const avgTemp = recentData
      .filter(d => d.data.temperature != null)
      .reduce((acc, d, _, arr) => acc + d.data.temperature / arr.length, 0);

    return `
Online devices: ${onlineDevices}/${devices.length}
Recent alerts: ${totalAlerts}
Average temperature: ${avgTemp.toFixed(1)}°C
Data points (24h): ${recentData.length}
`;
  }

  getDefaultAnalysis() {
    return {
      anomaly: false,
      confidence: 0.5,
      recommendations: ['Monitor device performance'],
      trend: 'stable'
    };
  }

  isServiceAvailable() {
    return this.isEnabled;
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;