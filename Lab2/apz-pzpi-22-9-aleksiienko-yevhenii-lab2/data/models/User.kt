package com.smartmonitoringapplication.app.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class User(
    val _id: String,
    val username: String,
    val email: String,
    val role: String = "user",
    val profile: UserProfile,
    val preferences: UserPreferences,
    val isActive: Boolean = true,
    val lastLogin: String? = null,
    val createdAt: String,
    val updatedAt: String
) : Parcelable

@Parcelize
data class UserProfile(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val timezone: String = "UTC"
) : Parcelable

@Parcelize
data class UserPreferences(
    val notifications: NotificationSettings,
    val thresholds: ThresholdSettings
) : Parcelable

@Parcelize
data class NotificationSettings(
    val email: Boolean = true,
    val push: Boolean = true,
    val temperature_alerts: Boolean = true,
    val motion_alerts: Boolean = true
) : Parcelable

@Parcelize
data class ThresholdSettings(
    val temperature_warning: Double = 38.0,
    val temperature_critical: Double = 40.0
) : Parcelable

// API Response wrappers
data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: AuthData? = null
)

data class AuthData(
    val token: String,
    val user: User
)

data class UserResponse(
    val success: Boolean,
    val message: String? = null,
    val data: UserData? = null
)

data class UserData(
    val user: User
)

// Request models
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null
)

data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val timezone: String? = null,
    val preferences: UserPreferences? = null
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)