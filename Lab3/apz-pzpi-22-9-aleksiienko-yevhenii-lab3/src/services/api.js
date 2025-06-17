const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = null
  }

  setAuthToken(token) {
    this.token = token
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config = {
      method: 'GET',
      headers,
      ...options
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url)
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  // Auth endpoints
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (userData) => this.post('/auth/register', userData),
    logout: () => this.post('/auth/logout'),
    getProfile: () => this.get('/auth/me'),
    updateProfile: (data) => this.put('/auth/profile', data),
    changePassword: (data) => this.put('/auth/change-password', data),
    refreshToken: () => this.post('/auth/refresh'),
    getStats: () => this.get('/auth/stats')
  }

  // Device endpoints
  devices = {
    getAll: (params) => this.get('/devices', params),
    getById: (deviceId) => this.get(`/devices/${deviceId}`),
    create: (deviceData) => this.post('/devices', deviceData),
    update: (deviceId, data) => this.put(`/devices/${deviceId}`, data),
    delete: (deviceId) => this.delete(`/devices/${deviceId}`),
    getData: (deviceId, params) => this.get(`/devices/${deviceId}/data`, params),
    getAlerts: (deviceId, params) => this.get(`/devices/${deviceId}/alerts`, params),
    sendCommand: (deviceId, command) => this.post(`/devices/${deviceId}/command`, command),
    getReport: (deviceId, params) => this.get(`/devices/${deviceId}/report`, params),
    getStatus: (deviceId) => this.get(`/devices/${deviceId}/status`)
  }

  // Analytics endpoints
  analytics = {
    getDashboard: () => this.get('/analytics/dashboard'),
    getTemperature: (params) => this.get('/analytics/temperature', params),
    getMotion: (params) => this.get('/analytics/motion', params),
    getRecommendations: (params) => this.get('/analytics/recommendations', params),
    getAlerts: (params) => this.get('/analytics/alerts', params),
    exportData: (params) => this.get('/analytics/export', params)
  }

  // Admin endpoints
  admin = {
    getDashboard: () => this.get('/admin/dashboard'),
    getUsers: (params) => this.get('/admin/users', params),
    getUserById: (userId) => this.get(`/admin/users/${userId}`),
    updateUser: (userId, data) => this.put(`/admin/users/${userId}`, data),
    getDevices: (params) => this.get('/admin/devices', params),
    sendDeviceCommand: (deviceId, command) => this.post(`/admin/devices/${deviceId}/command`, command),
    getSystemHealth: () => this.get('/admin/system/health'),
    getSystemLogs: (params) => this.get('/admin/system/logs', params),
    runMaintenance: (task) => this.post('/admin/system/maintenance', { task }),
    getGlobalAnalytics: (params) => this.get('/admin/analytics/global', params)
  }
}

export const api = new ApiService()