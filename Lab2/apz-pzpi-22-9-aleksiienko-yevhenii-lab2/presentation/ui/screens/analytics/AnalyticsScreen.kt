package com.smartmonitoringapplication.app.presentation.ui.screens.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartmonitoringapplication.app.data.api.Recommendation
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.presentation.viewmodel.AnalyticsViewModel
import com.smartmonitoringapplication.app.utils.Resource
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyticsScreen(
    viewModel: AnalyticsViewModel = hiltViewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsStateWithLifecycle()
    val recommendationsState by viewModel.recommendationsState.collectAsStateWithLifecycle()
    val isRefreshing by viewModel.isRefreshing.collectAsStateWithLifecycle()
    val selectedTimeRange by viewModel.selectedTimeRange.collectAsStateWithLifecycle()

    var selectedTabIndex by remember { mutableIntStateOf(0) }

    // Load data on screen open
    LaunchedEffect(Unit) {
        viewModel.getDashboardAnalytics()
        viewModel.getRecommendations()
    }

    val tabs = listOf(
        "Overview" to "📊",
        "Temperature" to "🌡️",
        "Motion" to "🚶",
        "Alerts" to "⚠️"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header with refresh and time range
        TopAppBar(
            title = {
                Text(
                    text = "Analytics",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            },
            actions = {
                // Time Range Selector
                var showTimeRangeMenu by remember { mutableStateOf(false) }

                TextButton(
                    onClick = { showTimeRangeMenu = true }
                ) {
                    Text(getTimeRangeText(selectedTimeRange))
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                }

                DropdownMenu(
                    expanded = showTimeRangeMenu,
                    onDismissRequest = { showTimeRangeMenu = false }
                ) {
                    viewModel.getTimeRangeOptions().forEach { (value, label) ->
                        DropdownMenuItem(
                            text = { Text(label) },
                            onClick = {
                                viewModel.setTimeRange(value)
                                showTimeRangeMenu = false
                            }
                        )
                    }
                }

                IconButton(
                    onClick = { viewModel.refreshAnalytics() }
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                }
            }
        )

        // Tab Row
        TabRow(selectedTabIndex = selectedTabIndex) {
            tabs.forEachIndexed { index, (title, emoji) ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(emoji)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(title)
                        }
                    }
                )
            }
        }

        // Tab Content
        when (selectedTabIndex) {
            0 -> OverviewTab(
                dashboardData = dashboardState?.data,
                recommendations = recommendationsState?.data,
                isLoading = dashboardState is Resource.Loading,
                onRefresh = { viewModel.refreshAnalytics() }
            )
            1 -> TemperatureTab(viewModel)
            2 -> MotionTab(viewModel)
            3 -> AlertsTab(viewModel)
        }
    }
}

@Composable
private fun OverviewTab(
    dashboardData: AnalyticsData?,
    recommendations: List<Recommendation>?,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Statistics Cards
            dashboardData?.stats?.let { stats ->
                StatsSection(stats)
            }
        }

        item {
            // Device Health
            dashboardData?.deviceHealth?.let { devices ->
                DeviceHealthSection(devices)
            }
        }

        item {
            // Recent Alerts
            dashboardData?.recentAlerts?.let { alerts ->
                RecentAlertsSection(alerts)
            }
        }

        item {
            // AI Recommendations
            recommendations?.let { recs ->
                RecommendationsSection(recs)
            }
        }

        item {
            // Temperature Trends Chart (simplified)
            dashboardData?.temperatureTrends?.let { trends ->
                TemperatureTrendsSection(trends)
            }
        }

        item {
            // Motion Activity
            dashboardData?.motionActivity?.let { motion ->
                MotionActivitySection(motion)
            }
        }
    }
}

@Composable
private fun StatsSection(stats: DashboardStats) {
    Column {
        Text(
            text = "Quick Stats",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Total Devices",
                value = stats.totalDevices.toString(),
                icon = Icons.Default.Devices,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Online",
                value = stats.onlineDevices.toString(),
                icon = Icons.Default.CheckCircle,
                color = Color(0xFF4CAF50),
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Data Points",
                value = stats.dataPointsToday.toString(),
                icon = Icons.Default.Analytics,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Alerts",
                value = stats.alertsThisWeek.toString(),
                icon = Icons.Default.Warning,
                color = if (stats.alertsThisWeek > 0) Color(0xFFFF9800) else Color(0xFF4CAF50),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = color
            )

            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun DeviceHealthSection(devices: List<DeviceHealth>) {
    Column {
        Text(
            text = "Device Health",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                devices.take(5).forEach { device ->
                    DeviceHealthItem(device)
                    if (device != devices.last()) {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                    }
                }

                if (devices.size > 5) {
                    Text(
                        text = "And ${devices.size - 5} more devices...",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun DeviceHealthItem(device: DeviceHealth) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = device.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = device.location,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            // Health Score
            val healthColor = when {
                device.healthScore >= 80 -> Color(0xFF4CAF50)
                device.healthScore >= 60 -> Color(0xFFFF9800)
                else -> Color(0xFFF44336)
            }

            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(healthColor.copy(alpha = 0.1f), RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${device.healthScore}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = healthColor,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Online Status
            Icon(
                imageVector = if (device.isOnline) Icons.Default.CheckCircle else Icons.Default.Error,
                contentDescription = null,
                tint = if (device.isOnline) Color(0xFF4CAF50) else Color(0xFFF44336),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun RecentAlertsSection(alerts: List<SensorData>) {
    Column {
        Text(
            text = "Recent Alerts",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        if (alerts.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF4CAF50).copy(alpha = 0.1f)
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("✅", style = MaterialTheme.typography.headlineLarge)
                    Text(
                        text = "No recent alerts",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF4CAF50)
                    )
                }
            }
        } else {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    alerts.take(3).forEach { alert ->
                        AlertItem(alert)
                        if (alert != alerts.last()) {
                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        }
                    }

                    if (alerts.size > 3) {
                        Text(
                            text = "And ${alerts.size - 3} more alerts...",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AlertItem(alert: SensorData) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = if (alert.alertLevel == "critical") "🚨" else "⚠️",
            style = MaterialTheme.typography.titleMedium
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "${alert.sensorType.replaceFirstChar { it.uppercase() }} Alert",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )

            Text(
                text = formatDateTime(alert.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        AlertLevelChip(alert.alertLevel)
    }
}

@Composable
private fun RecommendationsSection(recommendations: List<Recommendation>) {
    Column {
        Text(
            text = "AI Recommendations",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        if (recommendations.isEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("🤖", style = MaterialTheme.typography.headlineLarge)
                    Text(
                        text = "No recommendations available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(horizontal = 4.dp)
            ) {
                items(recommendations.take(3)) { recommendation ->
                    RecommendationCard(recommendation)
                }
            }
        }
    }
}

@Composable
private fun RecommendationCard(recommendation: Recommendation) {
    Card(
        modifier = Modifier.width(280.dp),
        colors = CardDefaults.cardColors(
            containerColor = getPriorityColor(recommendation.priority).copy(alpha = 0.1f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = recommendation.category.replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Surface(
                    color = getPriorityColor(recommendation.priority),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = recommendation.priority.uppercase(),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = recommendation.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = recommendation.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun TemperatureTrendsSection(trends: List<TemperatureTrend>) {
    Column {
        Text(
            text = "Temperature Trends",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (trends.isEmpty()) {
                    Text(
                        text = "No temperature data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    // Simple chart representation (you can use a charting library here)
                    Text(
                        text = "📈 Temperature data visualization",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    trends.take(5).forEach { trend ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Hour ${trend._id.hour ?: 0}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                text = "${trend.avgTemperature.format(1)}°C",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MotionActivitySection(motionActivity: List<MotionActivity>) {
    Column {
        Text(
            text = "Motion Activity",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (motionActivity.isEmpty()) {
                    Text(
                        text = "No motion data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    motionActivity.take(3).forEach { motion ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = motion._id,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "${motion.motionEvents} motion events",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            LinearProgressIndicator(
                                progress = if (motionActivity.isNotEmpty()) {
                                    motion.motionEvents.toFloat() / motionActivity.maxOf { it.motionEvents }.toFloat()
                                } else 0f,
                                modifier = Modifier
                                    .width(60.dp)
                                    .height(4.dp)
                                    .clip(RoundedCornerShape(2.dp))
                            )
                        }

                        if (motion != motionActivity.last()) {
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

// Placeholder tabs for future implementation
@Composable
private fun TemperatureTab(viewModel: AnalyticsViewModel) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🌡️", style = MaterialTheme.typography.displayMedium)
            Text("Temperature Analytics", style = MaterialTheme.typography.titleMedium)
            Text("Coming Soon", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun MotionTab(viewModel: AnalyticsViewModel) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🚶", style = MaterialTheme.typography.displayMedium)
            Text("Motion Analytics", style = MaterialTheme.typography.titleMedium)
            Text("Coming Soon", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun AlertsTab(viewModel: AnalyticsViewModel) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("⚠️", style = MaterialTheme.typography.displayMedium)
            Text("Alerts Analytics", style = MaterialTheme.typography.titleMedium)
            Text("Coming Soon", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

// Helper functions
@Composable
private fun AlertLevelChip(alertLevel: String) {
    val (backgroundColor, textColor) = when (alertLevel) {
        "critical" -> Color.Red.copy(alpha = 0.1f) to Color.Red
        "warning" -> Color(0xFFFF9800).copy(alpha = 0.1f) to Color(0xFFFF9800)
        else -> Color.Green.copy(alpha = 0.1f) to Color.Green
    }

    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = alertLevel.replaceFirstChar { it.uppercase() },
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.Medium
        )
    }
}

private fun getPriorityColor(priority: String): Color {
    return when (priority) {
        "high" -> Color.Red
        "medium" -> Color(0xFFFF9800)
        "low" -> Color(0xFF4CAF50)
        else -> Color.Gray
    }
}

private fun getTimeRangeText(timeRange: String): String {
    return when (timeRange) {
        "1h" -> "Last Hour"
        "24h" -> "Last 24h"
        "7d" -> "Last 7 Days"
        "30d" -> "Last 30 Days"
        else -> "Last 7 Days"
    }
}

private fun formatDateTime(dateString: String): String {
    return try {
        val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(dateString)
        SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()).format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}

private fun Double.format(digits: Int) = "%.${digits}f".format(this)