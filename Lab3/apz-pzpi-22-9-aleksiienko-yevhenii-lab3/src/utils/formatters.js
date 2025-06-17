// Date formatting utilities
export const formatDate = (date, locale = 'en-US') => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = (date, locale = 'en-US') => {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatRelativeTime = (date, locale = 'en-US') => {
  if (!date) return ''
  
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now - d) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date, locale)
}

// Number formatting utilities
export const formatTemperature = (temp, unit = 'C') => {
  if (temp === null || temp === undefined) return '--'
  return `${temp.toFixed(1)}°${unit}`
}

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '--'
  return `${Math.round(value)}%`
}

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  if (!bytes) return '--'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const formatDuration = (seconds) => {
  if (!seconds) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// Device status formatting
export const formatDeviceStatus = (status) => {
  const statusMap = {
    online: { text: 'Online', color: 'green' },
    offline: { text: 'Offline', color: 'red' },
    warning: { text: 'Warning', color: 'yellow' },
    critical: { text: 'Critical', color: 'red' }
  }
  
  return statusMap[status] || { text: 'Unknown', color: 'gray' }
}

// Alert level formatting
export const formatAlertLevel = (level) => {
  const levelMap = {
    info: { text: 'Info', color: 'blue', icon: 'ℹ️' },
    warning: { text: 'Warning', color: 'yellow', icon: '⚠️' },
    critical: { text: 'Critical', color: 'red', icon: '🚨' },
    normal: { text: 'Normal', color: 'green', icon: '✅' }
  }
  
  return levelMap[level] || { text: 'Unknown', color: 'gray', icon: '❓' }
}

// Signal strength formatting
export const formatSignalStrength = (strength) => {
  if (strength === null || strength === undefined) return '--'
  
  if (strength >= -50) return 'Excellent'
  if (strength >= -60) return 'Good'
  if (strength >= -70) return 'Fair'
  if (strength >= -80) return 'Poor'
  return 'Very Poor'
}

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password && password.length >= 6
}

export const validateDeviceId = (deviceId) => {
  const re = /^\d{8}-[a-zA-Z0-9]+-[a-zA-Z0-9]{5}$/
  return re.test(deviceId)
}