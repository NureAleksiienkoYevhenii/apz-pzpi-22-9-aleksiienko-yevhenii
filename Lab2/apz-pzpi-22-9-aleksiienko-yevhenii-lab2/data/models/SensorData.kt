package com.smartmonitoringapplication.app.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class SensorData(
    val _id: String,
    val deviceId: String,
    val userId: String,
    val sensorType: String, // temperature, motion, humidity, system
    val data: SensorReading,
    val alertLevel: String = "normal", // info, warning, critical, normal
    val processed: Boolean = false,
    val processingResult: ProcessingResult? = null,
    val metadata: SensorMetadata? = null,
    val createdAt: String,
    val updatedAt: String
) : Parcelable

@Parcelize
data class SensorReading(
    // Temperature sensor data
    val temperature: Double? = null,
    val humidity: Double? = null,

    // Motion sensor data
    val motionDetected: Boolean? = null,
    val sensorId: Int? = null,
    val location: String? = null,

    // System data
    val battery: Int? = null,
    val signalStrength: Int? = null,
    val memory: MemoryReading? = null,
    val uptime: Long? = null
) : Parcelable

@Parcelize
data class MemoryReading(
    val used: Long,
    val free: Long
) : Parcelable

@Parcelize
data class ProcessingResult(
    val anomaly: Boolean = false,
    val confidence: Double? = null,
    val recommendations: List<String> = emptyList(),
    val trend: String? = null // increasing, decreasing, stable, volatile
) : Parcelable

@Parcelize
data class SensorMetadata(
    val firmware: String? = null,
    val deviceTimestamp: Long? = null,
    val processingTime: Long? = null,
    val dataQuality: String = "good" // excellent, good, poor, invalid
) : Parcelable

// Analytics models
data class AnalyticsResponse(
    val success: Boolean,
    val message: String? = null,
    val data: AnalyticsData? = null
)

data class AnalyticsData(
    val stats: DashboardStats? = null,
    val recentAlerts: List<SensorData>? = null,
    val temperatureTrends: List<TemperatureTrend>? = null,
    val motionActivity: List<MotionActivity>? = null,
    val deviceHealth: List<DeviceHealth>? = null,
    val generatedAt: String? = null,

    // Temperature analytics
    val devices: List<DeviceTemperatureStats>? = null,
    val trends: List<TemperatureTrendDetailed>? = null,
    val statistics: OverallTemperatureStats? = null,
    val anomalies: List<SensorData>? = null,
    val period: AnalyticsPeriod? = null,

    // Motion analytics
    val patterns: List<MotionPattern>? = null,
    val locationActivity: List<LocationActivity>? = null,
    val hourlyDistribution: List<HourlyDistribution>? = null,

    // Alerts analytics
    val summary: AlertsSummary? = null,
    val alertsBySeverity: List<AlertsBySeverity>? = null,
    val alertsByDevice: List<AlertsByDevice>? = null,
    val alertTrends: List<AlertTrend>? = null,
    val recentCriticalAlerts: List<SensorData>? = null,
    val alertResolution: List<AlertResolution>? = null
)

@Parcelize
data class DashboardStats(
    val totalDevices: Int,
    val onlineDevices: Int,
    val dataPointsToday: Int,
    val alertsThisWeek: Int
) : Parcelable

@Parcelize
data class TemperatureTrend(
    val _id: TrendId,
    val avgTemperature: Double,
    val maxTemperature: Double,
    val minTemperature: Double,
    val avgHumidity: Double? = null,
    val dataPoints: Int,
    val alerts: Int
) : Parcelable

@Parcelize
data class TrendId(
    val hour: Int? = null,
    val deviceId: String? = null,
    val period: String? = null
) : Parcelable

@Parcelize
data class MotionActivity(
    val _id: String,
    val motionEvents: Int,
    val totalEvents: Int
) : Parcelable

@Parcelize
data class DeviceHealth(
    val deviceId: String,
    val name: String,
    val location: String,
    val healthScore: Int,
    val isOnline: Boolean,
    val lastSeen: String,
    val battery: Int? = null
) : Parcelable

// Additional analytics models
data class DeviceTemperatureStats(
    val deviceId: String,
    val name: String,
    val location: String,
    val statistics: TemperatureStatistics
)

data class TemperatureStatistics(
    val avgTemperature: Double? = null,
    val maxTemperature: Double? = null,
    val minTemperature: Double? = null,
    val dataPoints: Int = 0,
    val alerts: Int = 0
)

data class TemperatureTrendDetailed(
    val _id: DetailedTrendId,
    val avgTemperature: Double,
    val maxTemperature: Double,
    val minTemperature: Double,
    val avgHumidity: Double? = null,
    val dataPoints: Int,
    val alerts: Int
)

data class DetailedTrendId(
    val deviceId: String,
    val period: String
)

data class OverallTemperatureStats(
    val avgTemperature: Double? = null,
    val maxTemperature: Double? = null,
    val minTemperature: Double? = null,
    val avgHumidity: Double? = null,
    val totalDataPoints: Int = 0,
    val totalAlerts: Int = 0
)

data class AnalyticsPeriod(
    val start: String,
    val end: String,
    val granularity: String
)

// Motion analytics
data class MotionPattern(
    val _id: MotionPatternId,
    val motionEvents: Int,
    val totalEvents: Int
)

data class MotionPatternId(
    val deviceId: String,
    val location: String,
    val period: String
)

data class LocationActivity(
    val _id: String,
    val motionEvents: Int,
    val totalEvents: Int,
    val devices: List<String>
)

data class HourlyDistribution(
    val _id: Int, // hour
    val motionEvents: Int,
    val locations: List<String>
)

// Alerts analytics
data class AlertsSummary(
    val totalAlerts: Int,
    val deviceCount: Int,
    val period: AnalyticsPeriod
)

data class AlertsBySeverity(
    val _id: String, // alertLevel
    val count: Int,
    val devices: List<String>
)

data class AlertsByDevice(
    val _id: String, // deviceId
    val totalAlerts: Int,
    val warningAlerts: Int,
    val criticalAlerts: Int,
    val sensorTypes: List<String>
)

data class AlertTrend(
    val _id: AlertTrendId,
    val count: Int
)

data class AlertTrendId(
    val date: String,
    val alertLevel: String
)

data class AlertResolution(
    val _id: String, // sensorType
    val avgResponseTime: Double? = null,
    val totalAlerts: Int,
    val resolvedAlerts: Int
)

// Response wrapper for sensor data
data class SensorDataResponse(
    val success: Boolean,
    val message: String? = null,
    val data: SensorDataResponseData? = null
)

data class SensorDataResponseData(
    val rawData: List<SensorData>,
    val aggregatedData: List<TemperatureTrend>? = null,
    val period: String? = null,
    val deviceInfo: DeviceInfo? = null
)

data class DeviceInfo(
    val deviceId: String,
    val name: String,
    val location: String
)

// Alerts response
data class AlertsResponse(
    val success: Boolean,
    val message: String? = null,
    val data: AlertsData? = null
)

data class AlertsData(
    val alerts: List<SensorData>,
    val pagination: Pagination
)