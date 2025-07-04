package com.smartmonitoringapplication.app.utils

sealed class Resource<T>(
    val data: T? = null,
    val message: String? = null
) {
    class Success<T>(data: T) : Resource<T>(data)
    class Loading<T>(data: T? = null) : Resource<T>(data)
    class Error<T>(message: String, data: T? = null) : Resource<T>(data, message)
}

// Extension functions for easier handling
inline fun <T> Resource<T>.onSuccess(action: (value: T) -> Unit): Resource<T> {
    if (this is Resource.Success) data?.let { action(it) }
    return this
}

inline fun <T> Resource<T>.onError(action: (message: String) -> Unit): Resource<T> {
    if (this is Resource.Error) action(message ?: "Unknown error")
    return this
}

inline fun <T> Resource<T>.onLoading(action: () -> Unit): Resource<T> {
    if (this is Resource.Loading) action()
    return this
}