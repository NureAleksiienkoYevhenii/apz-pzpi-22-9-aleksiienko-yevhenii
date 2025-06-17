package com.smartmonitoringapplication.app.data.api

import com.smartmonitoringapplication.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface AnalyticsApiService {

    @GET("analytics/dashboard")
    suspend fun getDashboardAnalytics(): Response<AnalyticsResponse>

    @GET("analytics/temperature")
    suspend fun getTemperatureAnalytics(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("period") period: String = "day"
    ): Response<AnalyticsResponse>

    @GET("analytics/motion")
    suspend fun getMotionAnalytics(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("period") period: String = "day"
    ): Response<AnalyticsResponse>

    @GET("analytics/recommendations")
    suspend fun getRecommendations(
        @Query("deviceIds") deviceIds: String? = null
    ): Response<RecommendationsResponse>

    @GET("analytics/alerts")
    suspend fun getAlertsAnalytics(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<AnalyticsResponse>

    @GET("analytics/export")
    suspend fun exportAnalytics(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("format") format: String = "json",
        @Query("sensorType") sensorType: String? = null
    ): Response<ExportResponse>
}

data class RecommendationsResponse(
    val success: Boolean,
    val message: String? = null,
    val data: RecommendationsData? = null
)

data class RecommendationsData(
    val recommendations: List<Recommendation>,
    val generatedAt: String,
    val deviceIds: List<String>? = null
)

data class Recommendation(
    val category: String,
    val priority: String, // high, medium, low
    val title: String,
    val description: String,
    val action: String
)

data class ExportResponse(
    val success: Boolean,
    val message: String? = null,
    val data: String? = null // Export data as string
)