package com.smartmonitoringapplication.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.smartmonitoringapplication.app.presentation.ui.navigation.SmartMonitoringNavigation
import com.smartmonitoringapplication.app.presentation.ui.theme.SmartMonitoringTheme
import com.smartmonitoringapplication.app.presentation.viewmodel.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            SmartMonitoringTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val isLoggedIn by authViewModel.isLoggedIn.collectAsStateWithLifecycle(false)

                    SmartMonitoringNavigation(
                        isLoggedIn = isLoggedIn,
                        onLoginSuccess = {
                            // Handle login success if needed
                        }
                    )
                }
            }
        }
    }
}