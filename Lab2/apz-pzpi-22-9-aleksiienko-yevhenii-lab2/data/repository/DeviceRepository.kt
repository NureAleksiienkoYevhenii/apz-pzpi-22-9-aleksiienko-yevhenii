package com.smartmonitoringapplication.app.data.repository

import com.smartmonitoringapplication.app.data.api.CommandData
import com.smartmonitoringapplication.app.data.api.DeviceApiService
import com.smartmonitoringapplication.app.data.api.DeviceStatusData
import com.smartmonitoringapplication.app.data.api.ReportData
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeviceRepository @Inject constructor(
    private val deviceApiService: DeviceApiService
) {

    suspend fun getDevices(
        page: Int = 1,
        limit: Int = 10,
        sort: String = "-createdAt"
    ): Flow<Resource<DevicesData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.getDevices(page, limit, sort)

            if (response.isSuccessful && response.body()?.success == true) {
                val devicesData = response.body()?.data
                if (devicesData != null) {
                    emit(Resource.Success(devicesData))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get devices"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getDevice(deviceId: String): Flow<Resource<DeviceData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.getDevice(deviceId)

            if (response.isSuccessful && response.body()?.success == true) {
                val deviceData = response.body()?.data
                if (deviceData != null) {
                    emit(Resource.Success(deviceData))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get device"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun createDevice(request: CreateDeviceRequest): Flow<Resource<Device>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.createDevice(request)

            if (response.isSuccessful && response.body()?.success == true) {
                val device = response.body()?.data?.device
                if (device != null) {
                    emit(Resource.Success(device))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to create device"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun updateDevice(
        deviceId: String,
        request: UpdateDeviceRequest
    ): Flow<Resource<Device>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.updateDevice(deviceId, request)

            if (response.isSuccessful && response.body()?.success == true) {
                val device = response.body()?.data?.device
                if (device != null) {
                    emit(Resource.Success(device))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to update device"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun deleteDevice(deviceId: String): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.deleteDevice(deviceId)

            if (response.isSuccessful && response.body()?.success == true) {
                val message = response.body()?.message ?: "Device deleted successfully"
                emit(Resource.Success(message))
            } else {
                val errorMessage = response.body()?.message ?: "Failed to delete device"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getDeviceData(
        deviceId: String,
        startDate: String? = null,
        endDate: String? = null,
        period: String? = null
    ): Flow<Resource<SensorDataResponseData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.getDeviceData(deviceId, startDate, endDate, period)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get device data"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getDeviceAlerts(
        deviceId: String,
        page: Int = 1,
        limit: Int = 10
    ): Flow<Resource<AlertsData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.getDeviceAlerts(deviceId, page, limit)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get device alerts"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun sendCommand(
        deviceId: String,
        command: String,
        parameters: Map<String, Any> = emptyMap()
    ): Flow<Resource<CommandData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.sendCommand(
                deviceId,
                CommandRequest(command, parameters)
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to send command"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun generateReport(
        deviceId: String,
        timeRange: String = "24h"
    ): Flow<Resource<ReportData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.generateReport(deviceId, timeRange)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to generate report"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getDeviceStatus(deviceId: String): Flow<Resource<DeviceStatusData>> = flow {
        try {
            emit(Resource.Loading())

            val response = deviceApiService.getDeviceStatus(deviceId)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get device status"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }
}