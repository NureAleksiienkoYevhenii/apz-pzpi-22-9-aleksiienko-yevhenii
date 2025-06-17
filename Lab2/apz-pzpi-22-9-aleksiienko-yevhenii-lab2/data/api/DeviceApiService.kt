package com.smartmonitoringapplication.app.data.api

import com.smartmonitoringapplication.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface DeviceApiService {

    @GET("devices")
    suspend fun getDevices(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10,
        @Query("sort") sort: String = "-createdAt"
    ): Response<DevicesResponse>

    @POST("devices")
    suspend fun createDevice(@Body request: CreateDeviceRequest): Response<DeviceResponse>

    @GET("devices/{deviceId}")
    suspend fun getDevice(@Path("deviceId") deviceId: String): Response<DeviceResponse>

    @PUT("devices/{deviceId}")
    suspend fun updateDevice(
        @Path("deviceId") deviceId: String,
        @Body request: UpdateDeviceRequest
    ): Response<DeviceResponse>

    @DELETE("devices/{deviceId}")
    suspend fun deleteDevice(@Path("deviceId") deviceId: String): Response<DeviceResponse>

    @GET("devices/{deviceId}/data")
    suspend fun getDeviceData(
        @Path("deviceId") deviceId: String,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("period") period: String? = null
    ): Response<SensorDataResponse>

    @GET("devices/{deviceId}/alerts")
    suspend fun getDeviceAlerts(
        @Path("deviceId") deviceId: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): Response<AlertsResponse>

    @POST("devices/{deviceId}/command")
    suspend fun sendCommand(
        @Path("deviceId") deviceId: String,
        @Body request: CommandRequest
    ): Response<CommandResponse>

    @GET("devices/{deviceId}/report")
    suspend fun generateReport(
        @Path("deviceId") deviceId: String,
        @Query("timeRange") timeRange: String = "24h"
    ): Response<ReportResponse>

    @GET("devices/{deviceId}/status")
    suspend fun getDeviceStatus(@Path("deviceId") deviceId: String): Response<DeviceStatusResponse>
}

data class CommandResponse(
    val success: Boolean,
    val message: String,
    val data: CommandData? = null
)

data class CommandData(
    val command: String,
    val parameters: Map<String, Any>,
    val timestamp: Long
)

data class ReportResponse(
    val success: Boolean,
    val message: String? = null,
    val data: ReportData? = null
)

data class ReportData(
    val deviceId: String,
    val timeRange: String,
    val generatedAt: String,
    val report: String
)

data class DeviceStatusResponse(
    val success: Boolean,
    val message: String? = null,
    val data: DeviceStatusData? = null
)

data class DeviceStatusData(
    val deviceId: String,
    val name: String,
    val location: String,
    val status: DeviceStatus,
    val uptime: Long,
    val latestData: LatestData,
    val mqttStatus: MqttStatus
)

data class LatestData(
    val temperature: SensorData? = null,
    val motion: SensorData? = null,
    val system: SensorData? = null
)

data class MqttStatus(
    val connected: Boolean,
    val broker: String,
    val port: Int,
    val reconnectAttempts: Int
)