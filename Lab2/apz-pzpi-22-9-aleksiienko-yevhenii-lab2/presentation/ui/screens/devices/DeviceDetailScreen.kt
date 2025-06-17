package com.smartmonitoringapplication.app.presentation.ui.screens.device

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartmonitoringapplication.app.data.api.DeviceStatusData
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.presentation.viewmodel.DeviceViewModel
import com.smartmonitoringapplication.app.utils.Resource
import java.text.SimpleDateFormat
import androidx.navigation.NavController
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceDetailScreen(
    deviceId: String,
    onNavigateBack: () -> Unit,
    viewModel: DeviceViewModel = hiltViewModel()
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }

    val deviceState by viewModel.deviceState.collectAsStateWithLifecycle()
    val deviceDataState by viewModel.deviceDataState.collectAsStateWithLifecycle()
    val deviceAlertsState by viewModel.deviceAlertsState.collectAsStateWithLifecycle()
    val deviceStatusState by viewModel.deviceStatusState.collectAsStateWithLifecycle()

    // Load data on screen open
    LaunchedEffect(deviceId) {
        viewModel.getDevice(deviceId)
        viewModel.getDeviceData(deviceId)
        viewModel.getDeviceAlerts(deviceId)
        viewModel.getDeviceStatus(deviceId)
    }

    val tabs = listOf(
        "Overview" to "📊",
        "Data" to "📈",
        "Alerts" to "⚠️",
        "Settings" to "⚙️"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top App Bar
        TopAppBar(
            title = {
                Column {
                    Text(
                        text = deviceState?.data?.device?.name ?: "Device",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    deviceState?.data?.device?.let { device ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = device.location,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text("•", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = device.deviceId,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Text("•", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            StatusIndicator(isOnline = device.status.isOnline)
                        }
                    }
                }
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            actions = {
                // Live indicator
                Box(
                    modifier = Modifier
                        .background(
                            Color.Green.copy(alpha = 0.1f),
                            RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Color.Green, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Live",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Green
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Reboot button
                OutlinedButton(
                    onClick = {
                        viewModel.sendCommand(deviceId, "reboot")
                    },
                    enabled = deviceState?.data?.device?.status?.isOnline == true
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Reboot")
                }
            }
        )

        // Tab Row
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = MaterialTheme.colorScheme.surface
        ) {
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
                device = deviceState?.data?.device,
                deviceStatus = deviceStatusState?.data,
                onCommand = { command -> viewModel.sendCommand(deviceId, command) }
            )
            1 -> DataTab(
                sensorData = deviceDataState?.data?.rawData ?: emptyList(),
                isLoading = deviceDataState is Resource.Loading
            )
            2 -> AlertsTab(
                alerts = deviceAlertsState?.data?.alerts ?: emptyList(),
                isLoading = deviceAlertsState is Resource.Loading
            )
            3 -> SettingsTab(
                device = deviceState?.data?.device,
                onSaveSettings = { /* TODO: Implement settings save */ }
            )
        }
    }
}

@Composable
private fun StatusIndicator(isOnline: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(
                    if (isOnline) Color.Green else Color.Red,
                    CircleShape
                )
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = if (isOnline) "Online" else "Offline",
            style = MaterialTheme.typography.bodySmall,
            color = if (isOnline) Color.Green else Color.Red
        )
    }
}

@Composable
private fun OverviewTab(
    device: Device?,
    deviceStatus: DeviceStatusData?,
    onCommand: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Device Status Card
                Card(
                    modifier = Modifier.weight(1f),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Device Status",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        device?.let { dev ->
                            StatusRow("Status", if (dev.status.isOnline) "Online" else "Offline")
                            StatusRow("Last Seen", formatRelativeTime(dev.status.lastSeen))
                            dev.status.battery?.let { battery ->
                                StatusRow("Battery", "${battery.level}%")
                            }
                            dev.status.wifi.signalStrength?.let { signal ->
                                StatusRow("WiFi Signal", "$signal dBm")
                            }
                        }
                    }
                }

                // Current Readings Card
                Card(
                    modifier = Modifier.weight(1f),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Current Readings",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        deviceStatus?.latestData?.temperature?.let { tempData ->
                            tempData.data.temperature?.let { temp ->
                                ReadingCard(
                                    emoji = "🌡️",
                                    label = "Temperature",
                                    value = "${temp.format(1)}°C",
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        deviceStatus?.latestData?.temperature?.let { tempData ->
                            tempData.data.humidity?.let { humidity ->
                                ReadingCard(
                                    emoji = "💧",
                                    label = "Humidity",
                                    value = "${humidity.format(1)}%",
                                    color = Color.Cyan
                                )
                            }
                        }

                        if (deviceStatus?.latestData?.temperature == null) {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("📡", style = MaterialTheme.typography.headlineLarge)
                                Text(
                                    "No real-time data",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            // Quick Actions Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Quick Actions",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    val actions = listOf(
                        "🧪 Test Sensors" to "test_sensors",
                        "🎯 Calibrate" to "calibrate",
                        "🔧 Update Config" to "update_config",
                        "🔄 Reboot" to "reboot"
                    )

                    actions.forEach { (title, command) ->
                        OutlinedButton(
                            onClick = { onCommand(command) },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = device?.status?.isOnline == true,
                            colors = if (command == "reboot") {
                                ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            } else {
                                ButtonDefaults.outlinedButtonColors()
                            }
                        ) {
                            Text(
                                text = title,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DataTab(
    sensorData: List<SensorData>,
    isLoading: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Recent Sensor Data",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (sensorData.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("📊", style = MaterialTheme.typography.headlineLarge)
                    Text(
                        "No sensor data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn {
                    items(sensorData.take(20)) { data ->
                        SensorDataItem(data)
                    }
                }
            }
        }
    }
}

@Composable
private fun AlertsTab(
    alerts: List<SensorData>,
    isLoading: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Recent Alerts",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (alerts.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("✅", style = MaterialTheme.typography.headlineLarge)
                    Text(
                        "No alerts found",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn {
                    items(alerts) { alert ->
                        AlertItem(alert)
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsTab(
    device: Device?,
    onSaveSettings: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Device Settings",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Temperature Sensor",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = device?.configuration?.sensors?.temperature?.thresholds?.warning?.toString() ?: "38",
                    onValueChange = { /* TODO */ },
                    label = { Text("Warning Threshold (°C)") },
                    modifier = Modifier.weight(1f)
                )

                OutlinedTextField(
                    value = device?.configuration?.sensors?.temperature?.thresholds?.critical?.toString() ?: "40",
                    onValueChange = { /* TODO */ },
                    label = { Text("Critical Threshold (°C)") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onSaveSettings,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Settings")
            }
        }
    }
}

@Composable
private fun StatusRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun ReadingCard(
    emoji: String,
    label: String,
    value: String,
    color: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = emoji,
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = color
                )
            }
        }
    }
}

@Composable
private fun SensorDataItem(data: SensorData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = formatDateTime(data.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = data.sensorType.replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                when (data.sensorType) {
                    "temperature" -> {
                        data.data.temperature?.let { temp ->
                            Text("${temp.format(1)}°C")
                        }
                    }
                    "motion" -> {
                        Text(if (data.data.motionDetected == true) "Motion" else "No Motion")
                    }
                }
            }

            AlertLevelChip(data.alertLevel)
        }
    }
}

@Composable
private fun AlertItem(alert: SensorData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Text(
                text = if (alert.alertLevel == "critical") "🚨" else "⚠️",
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${alert.sensorType.replaceFirstChar { it.uppercase() }} Alert",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )

                when (alert.sensorType) {
                    "temperature" -> {
                        alert.data.temperature?.let { temp ->
                            Text(
                                text = "Temperature: ${temp.format(1)}°C",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                    "motion" -> {
                        Text(
                            text = "Motion detected",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                Text(
                    text = formatDateTime(alert.createdAt),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            AlertLevelChip(alert.alertLevel)
        }
    }
}

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

// Helper functions
private fun formatDateTime(dateString: String): String {
    return try {
        val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(dateString)
        SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()).format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}

private fun formatRelativeTime(dateString: String): String {
    return try {
        val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(dateString)
        val now = Date()
        val diff = now.time - (date?.time ?: 0)

        when {
            diff < 60000 -> "Just now"
            diff < 3600000 -> "${diff / 60000}m ago"
            diff < 86400000 -> "${diff / 3600000}h ago"
            else -> "${diff / 86400000}d ago"
        }
    } catch (e: Exception) {
        "Unknown"
    }
}

private fun Double.format(digits: Int) = "%.${digits}f".format(this)