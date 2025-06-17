package com.smartmonitoringapplication.app.data.api

import com.smartmonitoringapplication.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApiService {

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserResponse>

    @PUT("auth/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<UserResponse>

    @PUT("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<UserResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(): Response<AuthResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<UserResponse>

    @DELETE("auth/account")
    suspend fun deleteAccount(): Response<UserResponse>

    @GET("auth/stats")
    suspend fun getUserStats(): Response<UserStatsResponse>
}

data class UserStatsResponse(
    val success: Boolean,
    val message: String? = null,
    val data: UserStats? = null
)

data class UserStats(
    val devices: Int,
    val recentData: Int,
    val weeklyAlerts: Int,
    val memberSince: String,
    val lastLogin: String?
)