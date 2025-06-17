package com.smartmonitoringapplication.app.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class Device(
    val deviceId: String,
    val userId: User,
    val name: String,
    val description: String? = null,
    val location: String,
    val deviceType: String = "monitoring_station",
    val firmware: Firmware,
    val configuration: DeviceConfiguration,
    val status: DeviceStatus,
    val statistics: DeviceStatistics,
    val isActive: Boolean = true,
    val createdAt: String,
    val updatedAt: String
) : Parcelable

data class DeviceUser(
    val _id: String,
    val username: String,
    val email: String
)

@Parcelize
data class Firmware(
    val version: String = "1.0.0",
    val lastUpdate: String
) : Parcelable

@Parcelize
data class DeviceConfiguration(
    val sensors: SensorConfiguration,
    val alerts: AlertConfiguration
) : Parcelable

@Parcelize
data class SensorConfiguration(
    val temperature: TemperatureSensorConfig,
    val motion: MotionSensorConfig
) : Parcelable

@Parcelize
data class TemperatureSensorConfig(
    val enabled: Boolean = true,
    val interval: Int = 5000,
    val thresholds: TemperatureThresholds
) : Parcelable

@Parcelize
data class TemperatureThresholds(
    val warning: Double = 38.0,
    val critical: Double = 40.0
) : Parcelable

@Parcelize
data class MotionSensorConfig(
    val enabled: Boolean = true,
    val sensitivity: String = "medium",
    val zones: List<MotionZone> = emptyList()
) : Parcelable

@Parcelize
data class MotionZone(
    val id: Int,
    val name: String,
    val enabled: Boolean = true
) : Parcelable

@Parcelize
data class AlertConfiguration(
    val sound: Boolean = true,
    val frequency: Int = 7000
) : Parcelable

@Parcelize
data class DeviceStatus(
    val isOnline: Boolean = false,
    val lastSeen: String,
    val battery: BatteryStatus? = null,
    val wifi: WifiStatus,
    val memory: MemoryStatus? = null
) : Parcelable

@Parcelize
data class BatteryStatus(
    val level: Int? = null,
    val isCharging: Boolean = false
) : Parcelable

@Parcelize
data class WifiStatus(
    val connected: Boolean = false,
    val signalStrength: Int? = null,
    val ssid: String? = null
) : Parcelable

@Parcelize
data class MemoryStatus(
    val used: Long? = null,
    val free: Long? = null
) : Parcelable

@Parcelize
data class DeviceStatistics(
    val totalUptime: Long = 0,
    val totalAlerts: Int = 0,
    val lastReboot: String? = null,
    val dataPoints: DataPointsCount
) : Parcelable

@Parcelize
data class DataPointsCount(
    val today: Int = 0,
    val thisWeek: Int = 0,
    val thisMonth: Int = 0
) : Parcelable

// API Response models
data class DevicesResponse(
    val success: Boolean,
    val message: String? = null,
    val data: DevicesData? = null
)

data class DevicesData(
    val devices: List<Device>,
    val pagination: Pagination
)

data class DeviceResponse(
    val success: Boolean,
    val message: String? = null,
    val data: DeviceData? = null
)

data class DeviceData(
    val device: Device,
    val recentData: List<SensorData>? = null
)

data class Pagination(
    val current: Int,
    val pages: Int,
    val total: Int,
    val limit: Int
)

// Request models
data class CreateDeviceRequest(
    val name: String,
    val description: String? = null,
    val location: String,
    val deviceType: String = "monitoring_station",
    val configuration: DeviceConfiguration? = null
)

data class UpdateDeviceRequest(
    val name: String? = null,
    val description: String? = null,
    val location: String? = null,
    val configuration: DeviceConfiguration? = null,
    val isActive: Boolean? = null
)

data class CommandRequest(
    val command: String,
    val parameters: Map<String, Any> = emptyMap()
)