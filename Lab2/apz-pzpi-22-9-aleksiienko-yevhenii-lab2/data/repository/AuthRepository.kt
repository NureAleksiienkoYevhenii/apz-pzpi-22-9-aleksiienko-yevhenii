package com.smartmonitoringapplication.app.data.repository

import com.smartmonitoringapplication.app.data.api.AuthApiService
import com.smartmonitoringapplication.app.data.api.UserStats
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.data.preferences.UserPreferencesManager
import com.smartmonitoringapplication.app.utils.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val userPreferencesManager: UserPreferencesManager
) {

    suspend fun login(email: String, password: String): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.login(LoginRequest(email, password))

            if (response.isSuccessful && response.body()?.success == true) {
                val authData = response.body()?.data
                if (authData != null) {
                    // Save token and user data locally
                    userPreferencesManager.saveToken(authData.token)
                    userPreferencesManager.saveUser(authData.user)

                    emit(Resource.Success(authData.user))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Login failed"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun register(
        username: String,
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null,
        phone: String? = null
    ): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.register(
                RegisterRequest(username, email, password, firstName, lastName, phone)
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val authData = response.body()?.data
                if (authData != null) {
                    // Save token and user data locally
                    userPreferencesManager.saveToken(authData.token)
                    userPreferencesManager.saveUser(authData.user)

                    emit(Resource.Success(authData.user))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Registration failed"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getCurrentUser(): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.getCurrentUser()

            if (response.isSuccessful && response.body()?.success == true) {
                val userData = response.body()?.data?.user
                if (userData != null) {
                    // Update local user data
                    userPreferencesManager.saveUser(userData)
                    emit(Resource.Success(userData))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                emit(Resource.Error("Failed to get user data"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun updateProfile(request: UpdateProfileRequest): Flow<Resource<User>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.updateProfile(request)

            if (response.isSuccessful && response.body()?.success == true) {
                val userData = response.body()?.data?.user
                if (userData != null) {
                    // Update local user data
                    userPreferencesManager.saveUser(userData)
                    userPreferencesManager.updateUserProfile(
                        userData.profile.firstName,
                        userData.profile.lastName
                    )
                    emit(Resource.Success(userData))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                val errorMessage = response.body()?.message ?: "Profile update failed"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun changePassword(
        currentPassword: String,
        newPassword: String
    ): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.changePassword(
                ChangePasswordRequest(currentPassword, newPassword)
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val message = response.body()?.message ?: "Password changed successfully"
                emit(Resource.Success(message))
            } else {
                val errorMessage = response.body()?.message ?: "Password change failed"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun getUserStats(): Flow<Resource<UserStats>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.getUserStats()

            if (response.isSuccessful && response.body()?.success == true) {
                val stats = response.body()?.data
                if (stats != null) {
                    emit(Resource.Success(stats))
                } else {
                    emit(Resource.Error("Invalid response data"))
                }
            } else {
                emit(Resource.Error("Failed to get user stats"))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    suspend fun logout(): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.logout()

            // Clear local data regardless of API response
            userPreferencesManager.clearUserData()

            if (response.isSuccessful) {
                emit(Resource.Success("Logged out successfully"))
            } else {
                // Still consider it success since we cleared local data
                emit(Resource.Success("Logged out locally"))
            }
        } catch (e: Exception) {
            // Clear local data even if network fails
            userPreferencesManager.clearUserData()
            emit(Resource.Success("Logged out locally"))
        }
    }

    suspend fun deleteAccount(): Flow<Resource<String>> = flow {
        try {
            emit(Resource.Loading())

            val response = authApiService.deleteAccount()

            if (response.isSuccessful && response.body()?.success == true) {
                // Clear local data
                userPreferencesManager.clearUserData()
                val message = response.body()?.message ?: "Account deleted successfully"
                emit(Resource.Success(message))
            } else {
                val errorMessage = response.body()?.message ?: "Account deletion failed"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "Network error"))
        }
    }

    // Get locally stored user data
    fun getLocalUser() = userPreferencesManager.getUser()

    fun isLoggedIn() = userPreferencesManager.isLoggedIn()
}