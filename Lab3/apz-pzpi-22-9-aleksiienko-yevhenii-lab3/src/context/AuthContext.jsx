import React, { createContext, useState, useEffect } from 'react'
import { api } from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          api.setAuthToken(token)
          const response = await api.get('/auth/me')
          if (response.success) {
            setUser(response.data.user)
          } else {
            localStorage.removeItem('token')
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.success) {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        api.setAuthToken(token)
        setUser(user)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка входа в систему' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      if (response.success) {
        const { token, user } = response.data
        localStorage.setItem('token', token)
        api.setAuthToken(token)
        setUser(user)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка регистрации' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      api.setAuthToken(null)
      setUser(null)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      if (response.success) {
        setUser(response.data.user)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка обновления профиля' 
      }
    }
  }

  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh')
      if (response.success) {
        const { token } = response.data
        localStorage.setItem('token', token)
        api.setAuthToken(token)
        return true
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}