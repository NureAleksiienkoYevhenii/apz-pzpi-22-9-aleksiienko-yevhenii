package com.smartmonitoringapplication.app.presentation.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartmonitoringapplication.app.data.api.UserStats
import com.smartmonitoringapplication.app.data.models.User
import com.smartmonitoringapplication.app.presentation.viewmodel.AuthViewModel
import com.smartmonitoringapplication.app.utils.Resource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val localUser by viewModel.localUser.collectAsStateWithLifecycle(initialValue = null)
    val userStats by viewModel.userStats.collectAsStateWithLifecycle()
    val logoutState by viewModel.logoutState.collectAsStateWithLifecycle()
    val updateProfileState by viewModel.updateProfileState.collectAsStateWithLifecycle()
    val changePasswordState by viewModel.changePasswordState.collectAsStateWithLifecycle()

    var showLogoutDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }

    // Handle profile update success
    LaunchedEffect(updateProfileState) {
        if (updateProfileState is Resource.Success) {
            showEditDialog = false
            viewModel.clearUpdateProfileState()
            // Show success message
        }
    }

    // Handle password change success
    LaunchedEffect(changePasswordState) {
        if (changePasswordState is Resource.Success) {
            showChangePasswordDialog = false
            viewModel.clearChangePasswordState()
            // Show success message
        }
    }

    // Load user stats on screen open
    LaunchedEffect(Unit) {
        viewModel.getUserStats()
        viewModel.getCurrentUser()
    }

    // Handle logout
    LaunchedEffect(logoutState) {
        if (logoutState is Resource.Success) {
            onLogout()
            viewModel.clearLogoutState()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            // Profile Header
            ProfileHeader(
                user = localUser,
                onEditClick = { showEditDialog = true }
            )
        }

        item {
            // Statistics Cards
            UserStatisticsSection(userStats?.data)
        }

        item {
            // App Settings Section
            SettingsSection(
                title = "App Settings",
                items = listOf(
                    SettingItem(
                        icon = Icons.Default.Palette,
                        title = "Theme",
                        subtitle = "System default",
                        onClick = { /* TODO: Theme settings */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.Language,
                        title = "Language",
                        subtitle = "English",
                        onClick = { /* TODO: Language settings */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.Notifications,
                        title = "Notifications",
                        subtitle = "Push notifications enabled",
                        onClick = { /* TODO: Notification settings */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.Sync,
                        title = "Auto Refresh",
                        subtitle = "Every 5 minutes",
                        onClick = { /* TODO: Refresh settings */ }
                    )
                )
            )
        }

        item {
            // Account Settings Section
            SettingsSection(
                title = "Account",
                items = listOf(
                    SettingItem(
                        icon = Icons.Default.Lock,
                        title = "Change Password",
                        subtitle = "Update your password",
                        onClick = { showChangePasswordDialog = true }
                    ),
                    SettingItem(
                        icon = Icons.Default.Security,
                        title = "Security",
                        subtitle = "Two-factor authentication",
                        onClick = { /* TODO: Security settings */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.CloudDownload,
                        title = "Export Data",
                        subtitle = "Download your data",
                        onClick = { /* TODO: Export data */ }
                    )
                )
            )
        }

        item {
            // About Section
            SettingsSection(
                title = "About",
                items = listOf(
                    SettingItem(
                        icon = Icons.Default.Info,
                        title = "App Version",
                        subtitle = "1.0.0",
                        onClick = { /* TODO: App info */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.Help,
                        title = "Help & Support",
                        subtitle = "Get help or contact us",
                        onClick = { /* TODO: Help */ }
                    ),
                    SettingItem(
                        icon = Icons.Default.Policy,
                        title = "Privacy Policy",
                        subtitle = "Read our privacy policy",
                        onClick = { /* TODO: Privacy policy */ }
                    )
                )
            )
        }

        item {
            // Logout Button
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showLogoutDialog = true },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                ListItem(
                    headlineContent = {
                        Text(
                            "Sign Out",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontWeight = FontWeight.Medium
                        )
                    },
                    leadingContent = {
                        Icon(
                            Icons.Default.ExitToApp,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                    },
                    colors = ListItemDefaults.colors(
                        containerColor = Color.Transparent
                    )
                )
            }
        }
    }

    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Sign Out") },
            text = { Text("Are you sure you want to sign out?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
                    }
                ) {
                    Text("Sign Out")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false }
                ) {
                    Text("Cancel")
                }
            }
        )
    }

    // Edit Profile Dialog
    if (showEditDialog) {
        EditProfileDialog(
            user = localUser,
            isLoading = updateProfileState is Resource.Loading,
            onDismiss = {
                showEditDialog = false
                viewModel.clearUpdateProfileState()
            },
            onSave = { request ->
                viewModel.updateProfile(request)
            }
        )
    }

    // Change Password Dialog
    if (showChangePasswordDialog) {
        ChangePasswordDialog(
            isLoading = changePasswordState is Resource.Loading,
            onDismiss = {
                showChangePasswordDialog = false
                viewModel.clearChangePasswordState()
            },
            onChangePassword = { currentPassword, newPassword ->
                viewModel.changePassword(currentPassword, newPassword)
            }
        )
    }

    // Error handling for profile update
    updateProfileState?.let { state ->
        if (state is Resource.Error) {
            LaunchedEffect(state) {
                // Show error snackbar or toast
                // You can use SnackbarHost here
            }
        }
    }

    // Error handling for password change
    changePasswordState?.let { state ->
        if (state is Resource.Error) {
            LaunchedEffect(state) {
                // Show error snackbar or toast
            }
        }
    }
}

@Composable
private fun ProfileHeader(
    user: com.smartmonitoringapplication.app.data.preferences.UserData?,
    onEditClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(
                        MaterialTheme.colorScheme.primary,
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user?.firstName?.firstOrNull()?.toString()?.uppercase() ?: "U",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onPrimary,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Name
            Text(
                text = "${user?.firstName ?: ""} ${user?.lastName ?: ""}".trim().ifEmpty { "User" },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            // Email
            Text(
                text = user?.email ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Edit Button
            OutlinedButton(
                onClick = onEditClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Edit Profile")
            }
        }
    }
}

@Composable
private fun UserStatisticsSection(stats: UserStats?) {
    Column {
        Text(
            text = "Statistics",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Devices",
                value = stats?.devices?.toString() ?: "0",
                icon = Icons.Default.Devices,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Data Points",
                value = stats?.recentData?.toString() ?: "0",
                icon = Icons.Default.Analytics,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Weekly Alerts",
                value = stats?.weeklyAlerts?.toString() ?: "0",
                icon = Icons.Default.Warning,
                color = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Member Since",
                value = stats?.memberSince?.let { formatMemberSince(it) } ?: "N/A",
                icon = Icons.Default.DateRange,
                color = Color(0xFF4CAF50),
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
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    items: List<SettingItem>
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                items.forEachIndexed { index, item ->
                    ListItem(
                        headlineContent = {
                            Text(
                                item.title,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        supportingContent = {
                            Text(
                                item.subtitle,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        leadingContent = {
                            Icon(
                                item.icon,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                        },
                        trailingContent = {
                            Icon(
                                Icons.Default.ChevronRight,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { item.onClick() }
                    )

                    if (index < items.size - 1) {
                        HorizontalDivider(
                            modifier = Modifier.padding(horizontal = 16.dp),
                            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                        )
                    }
                }
            }
        }
    }
}

data class SettingItem(
    val icon: ImageVector,
    val title: String,
    val subtitle: String,
    val onClick: () -> Unit
)

private fun formatMemberSince(dateString: String): String {
    return try {
        val year = dateString.substring(0, 4)
        year
    } catch (e: Exception) {
        "2024"
    }
}