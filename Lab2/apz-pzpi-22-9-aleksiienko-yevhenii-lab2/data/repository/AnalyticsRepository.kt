package com.smartmonitoringapplication.app.data.repository

import com.smartmonitoringapplication.app.data.api.AnalyticsApiService
import com.smartmonitoringapplication.app.data.api.Recommendation
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsRepository @Inject constructor(
    private val analyticsApiService: AnalyticsApiService
) {

    suspend fun getDashboardAnalytics(): Flow<Resource<AnalyticsData>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.getDashboardAnalytics()

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get dashboard analytics"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getTemperatureAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        period: String = "day"
    ): Flow<Resource<AnalyticsData>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.getTemperatureAnalytics(startDate, endDate, period)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get temperature analytics"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getMotionAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        period: String = "day"
    ): Flow<Resource<AnalyticsData>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.getMotionAnalytics(startDate, endDate, period)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get motion analytics"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getRecommendations(deviceIds: String? = null): Flow<Resource<List<Recommendation>>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.getRecommendations(deviceIds)

            if (response.isSuccessful && response.body()?.success == true) {
                val recommendations = response.body()?.data?.recommendations
                if (recommendations != null) {
                    emit(Resource.Success(recommendations))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get recommendations"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getAlertsAnalytics(
        startDate: String? = null,
        endDate: String? = null
    ): Flow<Resource<AnalyticsData>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.getAlertsAnalytics(startDate, endDate)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to get alerts analytics"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun exportAnalytics(
        startDate: String? = null,
        endDate: String? = null,
        format: String = "json",
        sensorType: String? = null
    ): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())

            val response = analyticsApiService.exportAnalytics(startDate, endDate, format, sensorType)

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(Resource.Success(data))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Failed to export analytics"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }
}