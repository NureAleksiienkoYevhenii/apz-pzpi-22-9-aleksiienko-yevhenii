package com.smartmonitoringapplication.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartmonitoringapplication.app.data.api.Recommendation
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.data.repository.AnalyticsRepository
import com.smartmonitoringapplication.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AnalyticsViewModel @Inject constructor(
    private val analyticsRepository: AnalyticsRepository
) : ViewModel() {

    private val _dashboardState = MutableStateFlow<Resource<AnalyticsData>?>(null)
    val dashboardState: StateFlow<Resource<AnalyticsData>?> = _dashboardState.asStateFlow()

    private val _temperatureAnalyticsState = MutableStateFlow<Resource<AnalyticsData>?>(null)
    val temperatureAnalyticsState: StateFlow<Resource<AnalyticsData>?> = _temperatureAnalyticsState.asStateFlow()

    private val _motionAnalyticsState = MutableStateFlow<Resource<AnalyticsData>?>(null)
    val motionAnalyticsState: StateFlow<Resource<AnalyticsData>?> = _motionAnalyticsState.asStateFlow()

    private val _alertsAnalyticsState = MutableStateFlow<Resource<AnalyticsData>?>(null)
    val alertsAnalyticsState: StateFlow<Resource<AnalyticsData>?> = _alertsAnalyticsState.asStateFlow()

    private val _recommendationsState = MutableStateFlow<Resource<List<Recommendation>>?>(null)
    val recommendationsState: StateFlow<Resource<List<Recommendation>>?> = _recommendationsState.asStateFlow()

    private val _exportState = MutableStateFlow<Resource<String>?>(null)
    val exportState: StateFlow<Resource<String>?> = _exportState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    // Selected time range for analytics
    private val _selectedTimeRange = MutableStateFlow("7d")
    val selectedTimeRange: StateFlow<String> = _selectedTimeRange.asStateFlow()

    // Selected period for detailed analytics
    private val _selectedPeriod = MutableStateFlow("day")
    val selectedPeriod: StateFlow<String> = _selectedPeriod.asStateFlow()

    fun getDashboardAnalytics(refresh: Boolean = false) {
        viewModelScope.launch {
            if (refresh) {
                _isRefreshing.value = true
            }

            analyticsRepository.getDashboardAnalytics().collect { result ->
                _dashboardState.value = result
                if (refresh) {
                    _isRefreshing.value = false
                }
            }
        }
    }

    fun getTemperatureAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        period: String = _selectedPeriod.value
    ) {
        viewModelScope.launch {
            analyticsRepository.getTemperatureAnalytics(startDate, endDate, period).collect { result ->
                _temperatureAnalyticsState.value = result
            }
        }
    }

    fun getMotionAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        period: String = _selectedPeriod.value
    ) {
        viewModelScope.launch {
            analyticsRepository.getMotionAnalytics(startDate, endDate, period).collect { result ->
                _motionAnalyticsState.value = result
            }
        }
    }

    fun getAlertsAnalytics(
        startDate: String? = null,
        endDate: String? = null
    ) {
        viewModelScope.launch {
            analyticsRepository.getAlertsAnalytics(startDate, endDate).collect { result ->
                _alertsAnalyticsState.value = result
            }
        }
    }

    fun getRecommendations(deviceIds: String? = null) {
        viewModelScope.launch {
            analyticsRepository.getRecommendations(deviceIds).collect { result ->
                _recommendationsState.value = result
            }
        }
    }

    fun exportAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        format: String = "json",
        sensorType: String? = null
    ) {
        viewModelScope.launch {
            analyticsRepository.exportAnalytics(startDate, endDate, format, sensorType).collect { result ->
                _exportState.value = result
            }
        }
    }

    fun setTimeRange(timeRange: String) {
        _selectedTimeRange.value = timeRange
        refreshAnalytics()
    }

    fun setPeriod(period: String) {
        _selectedPeriod.value = period
        refreshDetailedAnalytics()
    }

    fun refreshAnalytics() {
        getDashboardAnalytics(refresh = true)
        getRecommendations()
    }

    fun refreshDetailedAnalytics() {
        val (startDate, endDate) = getDateRangeForTimeRange(_selectedTimeRange.value)
        getTemperatureAnalytics(startDate, endDate)
        getMotionAnalytics(startDate, endDate)
        getAlertsAnalytics(startDate, endDate)
    }

    private fun getDateRangeForTimeRange(timeRange: String): Pair<String?, String?> {
        val endDate = java.util.Date()
        val startDate = when (timeRange) {
            "1h" -> java.util.Date(endDate.time - 60 * 60 * 1000)
            "24h" -> java.util.Date(endDate.time - 24 * 60 * 60 * 1000)
            "7d" -> java.util.Date(endDate.time - 7 * 24 * 60 * 60 * 1000)
            "30d" -> java.util.Date(endDate.time - 30 * 24 * 60 * 60 * 1000)
            else -> java.util.Date(endDate.time - 7 * 24 * 60 * 60 * 1000)
        }

        val formatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault())
        formatter.timeZone = java.util.TimeZone.getTimeZone("UTC")

        return Pair(formatter.format(startDate), formatter.format(endDate))
    }

    // Clear states
    fun clearDashboardState() {
        _dashboardState.value = null
    }

    fun clearTemperatureAnalyticsState() {
        _temperatureAnalyticsState.value = null
    }

    fun clearMotionAnalyticsState() {
        _motionAnalyticsState.value = null
    }

    fun clearAlertsAnalyticsState() {
        _alertsAnalyticsState.value = null
    }

    fun clearRecommendationsState() {
        _recommendationsState.value = null
    }

    fun clearExportState() {
        _exportState.value = null
    }

    // Helper functions
    fun getTimeRangeOptions(): List<Pair<String, String>> {
        return listOf(
            "1h" to "Last Hour",
            "24h" to "Last 24 Hours",
            "7d" to "Last 7 Days",
            "30d" to "Last 30 Days"
        )
    }

    fun getPeriodOptions(): List<Pair<String, String>> {
        return listOf(
            "hour" to "Hourly",
            "day" to "Daily",
            "week" to "Weekly",
            "month" to "Monthly"
        )
    }

    fun getExportFormatOptions(): List<Pair<String, String>> {
        return listOf(
            "json" to "JSON",
            "csv" to "CSV"
        )
    }

    fun getSensorTypeOptions(): List<Pair<String, String>> {
        return listOf(
            "all" to "All Sensors",
            "temperature" to "Temperature",
            "motion" to "Motion",
            "humidity" to "Humidity",
            "system" to "System"
        )
    }

    // Analytics calculation helpers
    fun calculateHealthScore(device: DeviceHealth): Int {
        var score = 100

        // Connectivity penalty
        if (!device.isOnline) score -= 30

        // Battery penalty
        device.battery?.let { battery ->
            when {
                battery < 20 -> score -= 25
                battery < 50 -> score -= 10
            }
        }

        return maxOf(score, 0)
    }

    fun getAlertLevelColor(alertLevel: String): androidx.compose.ui.graphics.Color {
        return when (alertLevel) {
            "critical" -> androidx.compose.ui.graphics.Color.Red
            "warning" -> androidx.compose.ui.graphics.Color(0xFFFF9800)
            "info" -> androidx.compose.ui.graphics.Color.Blue
            else -> androidx.compose.ui.graphics.Color.Green
        }
    }

    fun getPriorityColor(priority: String): androidx.compose.ui.graphics.Color {
        return when (priority) {
            "high" -> androidx.compose.ui.graphics.Color.Red
            "medium" -> androidx.compose.ui.graphics.Color(0xFFFF9800)
            "low" -> androidx.compose.ui.graphics.Color.Green
            else -> androidx.compose.ui.graphics.Color.Gray
        }
    }

    fun formatTemperature(temperature: Double): String {
        return "${temperature.format(1)}°C"
    }

    fun formatHumidity(humidity: Double): String {
        return "${humidity.format(1)}%"
    }

    private fun Double.format(digits: Int) = "%.${digits}f".format(this)
}