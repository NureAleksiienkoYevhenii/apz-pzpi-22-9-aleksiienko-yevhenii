package com.smartmonitoringapplication.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartmonitoringapplication.app.data.api.CommandData
import com.smartmonitoringapplication.app.data.api.DeviceStatusData
import com.smartmonitoringapplication.app.data.api.ReportData
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.data.repository.DeviceRepository
import com.smartmonitoringapplication.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DeviceViewModel @Inject constructor(
    private val deviceRepository: DeviceRepository
) : ViewModel() {

    private val _devicesState = MutableStateFlow<Resource<DevicesData>?>(null)
    val devicesState: StateFlow<Resource<DevicesData>?> = _devicesState.asStateFlow()

    private val _deviceState = MutableStateFlow<Resource<DeviceData>?>(null)
    val deviceState: StateFlow<Resource<DeviceData>?> = _deviceState.asStateFlow()

    private val _deviceDataState = MutableStateFlow<Resource<SensorDataResponseData>?>(null)
    val deviceDataState: StateFlow<Resource<SensorDataResponseData>?> = _deviceDataState.asStateFlow()

    private val _deviceAlertsState = MutableStateFlow<Resource<AlertsData>?>(null)
    val deviceAlertsState: StateFlow<Resource<AlertsData>?> = _deviceAlertsState.asStateFlow()

    private val _deviceStatusState = MutableStateFlow<Resource<DeviceStatusData>?>(null)
    val deviceStatusState: StateFlow<Resource<DeviceStatusData>?> = _deviceStatusState.asStateFlow()

    private val _createDeviceState = MutableStateFlow<Resource<Device>?>(null)
    val createDeviceState: StateFlow<Resource<Device>?> = _createDeviceState.asStateFlow()

    private val _updateDeviceState = MutableStateFlow<Resource<Device>?>(null)
    val updateDeviceState: StateFlow<Resource<Device>?> = _updateDeviceState.asStateFlow()

    private val _deleteDeviceState = MutableStateFlow<Resource<String>?>(null)
    val deleteDeviceState: StateFlow<Resource<String>?> = _deleteDeviceState.asStateFlow()

    private val _commandState = MutableStateFlow<Resource<CommandData>?>(null)
    val commandState: StateFlow<Resource<CommandData>?> = _commandState.asStateFlow()

    private val _reportState = MutableStateFlow<Resource<ReportData>?>(null)
    val reportState: StateFlow<Resource<ReportData>?> = _reportState.asStateFlow()

    // Pagination state
    private val _currentPage = MutableStateFlow(1)
    val currentPage: StateFlow<Int> = _currentPage.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    fun getDevices(
        page: Int = 1,
        limit: Int = 10,
        sort: String = "-createdAt",
        refresh: Boolean = false
    ) {
        viewModelScope.launch {
            if (refresh) {
                _isRefreshing.value = true
            }

            deviceRepository.getDevices(page, limit, sort).collect { result ->
                _devicesState.value = result
                _currentPage.value = page
                if (refresh) {
                    _isRefreshing.value = false
                }
            }
        }
    }

    fun getDevice(deviceId: String) {
        viewModelScope.launch {
            deviceRepository.getDevice(deviceId).collect { result ->
                _deviceState.value = result
            }
        }
    }

    fun createDevice(request: CreateDeviceRequest) {
        viewModelScope.launch {
            deviceRepository.createDevice(request).collect { result ->
                _createDeviceState.value = result
            }
        }
    }

    fun updateDevice(deviceId: String, request: UpdateDeviceRequest) {
        viewModelScope.launch {
            deviceRepository.updateDevice(deviceId, request).collect { result ->
                _updateDeviceState.value = result
                // Refresh device details if successful
                if (result is Resource.Success) {
                    getDevice(deviceId)
                }
            }
        }
    }

    fun deleteDevice(deviceId: String) {
        viewModelScope.launch {
            deviceRepository.deleteDevice(deviceId).collect { result ->
                _deleteDeviceState.value = result
            }
        }
    }

    fun getDeviceData(
        deviceId: String,
        startDate: String? = null,
        endDate: String? = null,
        period: String? = null
    ) {
        viewModelScope.launch {
            deviceRepository.getDeviceData(deviceId, startDate, endDate, period).collect { result ->
                _deviceDataState.value = result
            }
        }
    }

    fun getDeviceAlerts(
        deviceId: String,
        page: Int = 1,
        limit: Int = 10
    ) {
        viewModelScope.launch {
            deviceRepository.getDeviceAlerts(deviceId, page, limit).collect { result ->
                _deviceAlertsState.value = result
            }
        }
    }

    fun sendCommand(
        deviceId: String,
        command: String,
        parameters: Map<String, Any> = emptyMap()
    ) {
        viewModelScope.launch {
            deviceRepository.sendCommand(deviceId, command, parameters).collect { result ->
                _commandState.value = result
            }
        }
    }

    fun generateReport(deviceId: String, timeRange: String = "24h") {
        viewModelScope.launch {
            deviceRepository.generateReport(deviceId, timeRange).collect { result ->
                _reportState.value = result
            }
        }
    }

    fun getDeviceStatus(deviceId: String) {
        viewModelScope.launch {
            deviceRepository.getDeviceStatus(deviceId).collect { result ->
                _deviceStatusState.value = result
            }
        }
    }

    fun refreshDeviceStatus(deviceId: String) {
        getDeviceStatus(deviceId)
    }

    fun refreshDeviceData(deviceId: String) {
        getDeviceData(deviceId)
        getDeviceAlerts(deviceId)
    }

    fun loadNextPage() {
        val nextPage = _currentPage.value + 1
        getDevices(page = nextPage)
    }

    fun refreshDevices() {
        getDevices(page = 1, refresh = true)
    }

    // Clear states
    fun clearDeviceState() {
        _deviceState.value = null
    }

    fun clearCreateDeviceState() {
        _createDeviceState.value = null
    }

    fun clearUpdateDeviceState() {
        _updateDeviceState.value = null
    }

    fun clearDeleteDeviceState() {
        _deleteDeviceState.value = null
    }

    fun clearCommandState() {
        _commandState.value = null
    }

    fun clearReportState() {
        _reportState.value = null
    }

    fun clearDeviceDataState() {
        _deviceDataState.value = null
    }

    fun clearDeviceAlertsState() {
        _deviceAlertsState.value = null
    }

    fun clearDeviceStatusState() {
        _deviceStatusState.value = null
    }

    // Helper functions
    fun getAvailableCommands(): List<String> {
        return listOf("reboot", "update_config", "test_sensors", "calibrate")
    }

    fun getTimeRangeOptions(): List<Pair<String, String>> {
        return listOf(
            "1h" to "Last Hour",
            "24h" to "Last 24 Hours",
            "7d" to "Last 7 Days",
            "30d" to "Last 30 Days"
        )
    }

    fun getDeviceTypeOptions(): List<Pair<String, String>> {
        return listOf(
            "monitoring_station" to "Monitoring Station",
            "sensor_hub" to "Sensor Hub",
            "smart_home" to "Smart Home"
        )
    }
}