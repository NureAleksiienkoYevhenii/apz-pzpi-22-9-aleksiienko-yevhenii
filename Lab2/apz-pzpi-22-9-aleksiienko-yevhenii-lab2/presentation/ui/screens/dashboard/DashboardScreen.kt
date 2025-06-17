package com.smartmonitoringapplication.app.presentation.ui.screens.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartmonitoringapplication.app.presentation.viewmodel.AnalyticsViewModel
import com.smartmonitoringapplication.app.utils.Resource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: AnalyticsViewModel = hiltViewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsStateWithLifecycle()
    val isRefreshing by viewModel.isRefreshing.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.getDashboardAnalytics()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Dashboard",
                style = MaterialTheme.typography.headlineMedium
            )

            IconButton(
                onClick = { viewModel.getDashboardAnalytics(refresh = true) }
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refresh"
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (val currentState = dashboardState) {
            is Resource.Loading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is Resource.Success -> {
                val data = currentState.data
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Stats Cards
                    item {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            data?.stats?.let { stats ->
                                item {
                                    StatsCard(
                                        title = "Total Devices",
                                        value = stats.totalDevices.toString(),
                                        icon = Icons.Default.Devices,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                item {
                                    StatsCard(
                                        title = "Online Devices",
                                        value = stats.onlineDevices.toString(),
                                        icon = Icons.Default.CheckCircle,
                                        color = MaterialTheme.colorScheme.tertiary
                                    )
                                }
                                item {
                                    StatsCard(
                                        title = "Data Points Today",
                                        value = stats.dataPointsToday.toString(),
                                        icon = Icons.Default.DataUsage,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                                item {
                                    StatsCard(
                                        title = "Alerts This Week",
                                        value = stats.alertsThisWeek.toString(),
                                        icon = Icons.Default.Warning,
                                        color = MaterialTheme.colorScheme.error
                                    )
                                }
                            }
                        }
                    }

                    // Recent Alerts
                    data?.recentAlerts?.let { alerts ->
                        if (alerts.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Recent Alerts",
                                    style = MaterialTheme.typography.titleLarge
                                )
                            }

                            items(alerts.take(5)) { alert ->
                                AlertCard(alert = alert)
                            }
                        }
                    }

                    // Device Health
                    data?.deviceHealth?.let { devices ->
                        if (devices.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Device Health",
                                    style = MaterialTheme.typography.titleLarge
                                )
                            }

                            items(devices) { device ->
                                DeviceHealthCard(device = device)
                            }
                        }
                    }
                }
            }

            is Resource.Error -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ErrorOutline,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.error
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = currentState.message ?: "Failed to load dashboard",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { viewModel.getDashboardAnalytics() }
                    ) {
                        Text("Retry")
                    }
                }
            }

            null -> {
                // Initial state
            }
        }
    }
}

@Composable
fun StatsCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.width(150.dp),
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
                style = MaterialTheme.typography.headlineSmall,
                color = color
            )

            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun AlertCard(
    alert: com.smartmonitoringapplication.app.data.models.SensorData,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (alert.alertLevel) {
                "critical" -> MaterialTheme.colorScheme.errorContainer
                "warning" -> MaterialTheme.colorScheme.tertiaryContainer
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = when (alert.alertLevel) {
                    "critical" -> Icons.Default.Error
                    "warning" -> Icons.Default.Warning
                    else -> Icons.Default.Info
                },
                contentDescription = null,
                tint = when (alert.alertLevel) {
                    "critical" -> MaterialTheme.colorScheme.error
                    "warning" -> MaterialTheme.colorScheme.tertiary
                    else -> MaterialTheme.colorScheme.primary
                }
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${alert.sensorType.uppercase()} Alert",
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = "Device: ${alert.deviceId}",
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Text(
                text = alert.alertLevel.uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = when (alert.alertLevel) {
                    "critical" -> MaterialTheme.colorScheme.error
                    "warning" -> MaterialTheme.colorScheme.tertiary
                    else -> MaterialTheme.colorScheme.primary
                }
            )
        }
    }
}

@Composable
fun DeviceHealthCard(
    device: com.smartmonitoringapplication.app.data.models.DeviceHealth,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = device.name,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = device.location,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (device.isOnline) Icons.Default.CheckCircle else Icons.Default.Error,
                        contentDescription = null,
                        tint = if (device.isOnline) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (device.isOnline) "Online" else "Offline",
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Text(
                    text = "Health: ${device.healthScore}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = when {
                        device.healthScore >= 80 -> MaterialTheme.colorScheme.tertiary
                        device.healthScore >= 50 -> MaterialTheme.colorScheme.secondary
                        else -> MaterialTheme.colorScheme.error
                    }
                )
            }
        }
    }
}