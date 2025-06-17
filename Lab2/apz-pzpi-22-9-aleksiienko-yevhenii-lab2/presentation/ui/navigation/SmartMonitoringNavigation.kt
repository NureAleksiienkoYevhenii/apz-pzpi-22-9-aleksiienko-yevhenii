package com.smartmonitoringapplication.app.presentation.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.smartmonitoringapplication.app.presentation.ui.screens.auth.LoginScreen
import com.smartmonitoringapplication.app.presentation.ui.screens.auth.RegisterScreen
import com.smartmonitoringapplication.app.presentation.ui.screens.main.MainScreen

@Composable
fun SmartMonitoringNavigation(
    isLoggedIn: Boolean,
    onLoginSuccess: () -> Unit,
    navController: NavHostController = rememberNavController()
) {
    val startDestination = if (isLoggedIn) {
        Screen.Main.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Auth screens
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                },
                onNavigateToMain = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                    onLoginSuccess()
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                },
                onNavigateToMain = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Register.route) { inclusive = true }
                    }
                    onLoginSuccess()
                }
            )
        }

        // Main app screen (contains bottom navigation)
        composable(Screen.Main.route) {
            MainScreen(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Main.route) { inclusive = true }
                    }
                }
            )
        }
    }
}

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Main : Screen("main")

    // Main app screens (accessed via bottom navigation)
    object Dashboard : Screen("dashboard")
    object Devices : Screen("devices")
    object DeviceDetails : Screen("device_details/{deviceId}") {
        fun createRoute(deviceId: String) = "device_details/$deviceId"
    }
    object Analytics : Screen("analytics")
    object Profile : Screen("profile")
}