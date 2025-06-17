package com.smartmonitoringapplication.app.presentation.ui.screens.main

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.smartmonitoringapplication.app.R
import com.smartmonitoringapplication.app.presentation.ui.screens.device.DeviceDetailScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            // Hide bottom bar on device detail screen
            if (currentRoute?.startsWith("device_details") != true) {
                NavigationBar {
                    val currentDestination = navBackStackEntry?.destination

                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = null) },
                            label = { Text(stringResource(item.labelRes)) },
                            selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "dashboard",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("dashboard") {
                com.smartmonitoringapplication.app.presentation.ui.screens.dashboard.DashboardScreen()
            }
            composable("devices") {
                com.smartmonitoringapplication.app.presentation.ui.screens.devices.DevicesScreen(
                    navController = navController
                )
            }
            composable("device_details/{deviceId}") { backStackEntry ->
                val deviceId = backStackEntry.arguments?.getString("deviceId") ?: ""
                DeviceDetailScreen(
                    deviceId = deviceId,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }
            composable("analytics") {
                com.smartmonitoringapplication.app.presentation.ui.screens.analytics.AnalyticsScreen()
            }
            composable("profile") {
                com.smartmonitoringapplication.app.presentation.ui.screens.profile.ProfileScreen(
                    onLogout = onLogout
                )
            }
        }
    }
}

@Composable
fun AnalyticsScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text("Analytics Screen - Coming Soon")
    }
}

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Profile Screen - Coming Soon")

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onLogout,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error
            )
        ) {
            Text("Logout")
        }
    }
}

data class BottomNavItem(
    val route: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val labelRes: Int
)

val bottomNavItems = listOf(
    BottomNavItem("dashboard", Icons.Filled.Home, R.string.nav_dashboard),
    BottomNavItem("devices", Icons.Filled.Devices, R.string.nav_devices),
    BottomNavItem("analytics", Icons.Filled.Analytics, R.string.nav_analytics),
    BottomNavItem("profile", Icons.Filled.Person, R.string.nav_profile)
)