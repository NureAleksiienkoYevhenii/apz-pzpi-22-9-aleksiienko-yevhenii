package com.smartmonitoringapplication.app.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartmonitoringapplication.app.data.api.UserStats
import com.smartmonitoringapplication.app.data.models.*
import com.smartmonitoringapplication.app.data.repository.AuthRepository
import com.smartmonitoringapplication.app.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<Resource<User>?>(null)
    val authState: StateFlow<Resource<User>?> = _authState.asStateFlow()

    private val _userStats = MutableStateFlow<Resource<UserStats>?>(null)
    val userStats: StateFlow<Resource<UserStats>?> = _userStats.asStateFlow()

    private val _updateProfileState = MutableStateFlow<Resource<User>?>(null)
    val updateProfileState: StateFlow<Resource<User>?> = _updateProfileState.asStateFlow()

    private val _changePasswordState = MutableStateFlow<Resource<String>?>(null)
    val changePasswordState: StateFlow<Resource<String>?> = _changePasswordState.asStateFlow()

    private val _logoutState = MutableStateFlow<Resource<String>?>(null)
    val logoutState: StateFlow<Resource<String>?> = _logoutState.asStateFlow()

    // Get user data from local storage
    val localUser = authRepository.getLocalUser()
    val isLoggedIn = authRepository.isLoggedIn()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            authRepository.login(email, password).collect { result ->
                _authState.value = result
            }
        }
    }

    fun register(
        username: String,
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null,
        phone: String? = null
    ) {
        viewModelScope.launch {
            authRepository.register(username, email, password, firstName, lastName, phone).collect { result ->
                _authState.value = result
            }
        }
    }

    fun getCurrentUser() {
        viewModelScope.launch {
            authRepository.getCurrentUser().collect { result ->
                _authState.value = result
            }
        }
    }

    fun updateProfile(request: UpdateProfileRequest) {
        viewModelScope.launch {
            authRepository.updateProfile(request).collect { result ->
                _updateProfileState.value = result
                // Also update the auth state if successful
                if (result is Resource.Success) {
                    _authState.value = result
                }
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String) {
        viewModelScope.launch {
            authRepository.changePassword(currentPassword, newPassword).collect { result ->
                _changePasswordState.value = result
            }
        }
    }

    fun getUserStats() {
        viewModelScope.launch {
            authRepository.getUserStats().collect { result ->
                _userStats.value = result
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout().collect { result ->
                _logoutState.value = result
                if (result is Resource.Success) {
                    // Clear all states
                    _authState.value = null
                    _userStats.value = null
                    _updateProfileState.value = null
                    _changePasswordState.value = null
                }
            }
        }
    }

    fun deleteAccount() {
        viewModelScope.launch {
            authRepository.deleteAccount().collect { result ->
                _logoutState.value = result
                if (result is Resource.Success) {
                    // Clear all states
                    _authState.value = null
                    _userStats.value = null
                    _updateProfileState.value = null
                    _changePasswordState.value = null
                }
            }
        }
    }

    // Clear states
    fun clearAuthState() {
        _authState.value = null
    }

    fun clearUpdateProfileState() {
        _updateProfileState.value = null
    }

    fun clearChangePasswordState() {
        _changePasswordState.value = null
    }

    fun clearLogoutState() {
        _logoutState.value = null
    }

    fun clearUserStats() {
        _userStats.value = null
    }

    // Validation helpers
    fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }

    fun isValidPassword(password: String): Boolean {
        return password.length >= 6
    }

    fun isValidUsername(username: String): Boolean {
        return username.length >= 3 && username.matches(Regex("^[a-zA-Z0-9]+$"))
    }
}