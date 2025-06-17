package com.smartmonitoringapplication.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.smartmonitoringapplication.app.data.models.User
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

@Singleton
class UserPreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USERNAME_KEY = stringPreferencesKey("username")
        private val EMAIL_KEY = stringPreferencesKey("email")
        private val FIRST_NAME_KEY = stringPreferencesKey("first_name")
        private val LAST_NAME_KEY = stringPreferencesKey("last_name")
        private val IS_LOGGED_IN_KEY = booleanPreferencesKey("is_logged_in")
        private val THEME_MODE_KEY = stringPreferencesKey("theme_mode")
        private val LANGUAGE_KEY = stringPreferencesKey("language")
        private val NOTIFICATIONS_ENABLED_KEY = booleanPreferencesKey("notifications_enabled")
        private val AUTO_REFRESH_KEY = booleanPreferencesKey("auto_refresh")
        private val REFRESH_INTERVAL_KEY = intPreferencesKey("refresh_interval")
    }

    // Auth related
    suspend fun saveToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    fun getToken(): Flow<String?> {
        return dataStore.data.map { preferences ->
            preferences[TOKEN_KEY]
        }
    }

    suspend fun saveUser(user: User) {
        dataStore.edit { preferences ->
            preferences[USER_ID_KEY] = user._id
            preferences[USERNAME_KEY] = user.username
            preferences[EMAIL_KEY] = user.email
            preferences[FIRST_NAME_KEY] = user.profile.firstName ?: ""
            preferences[LAST_NAME_KEY] = user.profile.lastName ?: ""
            preferences[IS_LOGGED_IN_KEY] = true
        }
    }

    suspend fun updateUserProfile(firstName: String?, lastName: String?) {
        dataStore.edit { preferences ->
            firstName?.let { preferences[FIRST_NAME_KEY] = it }
            lastName?.let { preferences[LAST_NAME_KEY] = it }
        }
    }

    fun getUser(): Flow<UserData?> {
        return dataStore.data.map { preferences ->
            val userId = preferences[USER_ID_KEY]
            if (userId != null) {
                UserData(
                    id = userId,
                    username = preferences[USERNAME_KEY] ?: "",
                    email = preferences[EMAIL_KEY] ?: "",
                    firstName = preferences[FIRST_NAME_KEY] ?: "",
                    lastName = preferences[LAST_NAME_KEY] ?: ""
                )
            } else null
        }
    }

    fun isLoggedIn(): Flow<Boolean> {
        return dataStore.data.map { preferences ->
            preferences[IS_LOGGED_IN_KEY] ?: false
        }
    }

    suspend fun clearUserData() {
        dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
            preferences.remove(USER_ID_KEY)
            preferences.remove(USERNAME_KEY)
            preferences.remove(EMAIL_KEY)
            preferences.remove(FIRST_NAME_KEY)
            preferences.remove(LAST_NAME_KEY)
            preferences[IS_LOGGED_IN_KEY] = false
        }
    }

    // App settings
    suspend fun setThemeMode(themeMode: String) {
        dataStore.edit { preferences ->
            preferences[THEME_MODE_KEY] = themeMode
        }
    }

    fun getThemeMode(): Flow<String> {
        return dataStore.data.map { preferences ->
            preferences[THEME_MODE_KEY] ?: "system"
        }
    }

    suspend fun setLanguage(language: String) {
        dataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = language
        }
    }

    fun getLanguage(): Flow<String> {
        return dataStore.data.map { preferences ->
            preferences[LANGUAGE_KEY] ?: "en"
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[NOTIFICATIONS_ENABLED_KEY] = enabled
        }
    }

    fun getNotificationsEnabled(): Flow<Boolean> {
        return dataStore.data.map { preferences ->
            preferences[NOTIFICATIONS_ENABLED_KEY] ?: true
        }
    }

    suspend fun setAutoRefresh(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[AUTO_REFRESH_KEY] = enabled
        }
    }

    fun getAutoRefresh(): Flow<Boolean> {
        return dataStore.data.map { preferences ->
            preferences[AUTO_REFRESH_KEY] ?: true
        }
    }

    suspend fun setRefreshInterval(intervalMinutes: Int) {
        dataStore.edit { preferences ->
            preferences[REFRESH_INTERVAL_KEY] = intervalMinutes
        }
    }

    fun getRefreshInterval(): Flow<Int> {
        return dataStore.data.map { preferences ->
            preferences[REFRESH_INTERVAL_KEY] ?: 5 // 5 minutes default
        }
    }
}

data class UserData(
    val id: String,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String
)