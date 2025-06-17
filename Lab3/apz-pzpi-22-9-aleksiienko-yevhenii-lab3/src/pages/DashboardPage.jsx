import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { useSocket } from '../hooks/useSocket'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatRelativeTime, formatTemperature, formatAlertLevel } from '../utils/formatters'

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { user } = useAuth()
  const { t } = useLanguage()
  const { connected, realtimeData } = useSocket()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.analytics.getDashboard()
      if (response.success) {
        setDashboardData(response.data)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={loadDashboardData}>
          {t('common.refresh')}
        </Button>
      </div>
    )
  }

  const stats = dashboardData?.stats || {}
  const recentAlerts = dashboardData?.recentAlerts || []
  const deviceHealth = dashboardData?.deviceHealth || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.profile?.firstName || user?.username })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🏠</div>
              </div>
              <div className="ml-4">
                <p className="text-blue-100 text-sm">{t('dashboard.totalDevices')}</p>
                <p className="text-2xl font-bold">{stats.totalDevices || 0}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <div className="text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-green-100 text-sm">{t('dashboard.onlineDevices')}</p>
                <p className="text-2xl font-bold">{stats.onlineDevices || 0}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600">
          <div className="text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">⚠️</div>
              </div>
              <div className="ml-4">
                <p className="text-yellow-100 text-sm">{t('dashboard.todayAlerts')}</p>
                <p className="text-2xl font-bold">{stats.alertsThisWeek || 0}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-purple-100 text-sm">{t('dashboard.dataPoints')}</p>
                <p className="text-2xl font-bold">{stats.dataPointsToday || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card 
          title={t('dashboard.recentAlerts')}
          headerActions={
            <Link to="/analytics">
              <Button variant="outline" size="small">
                View All
              </Button>
            </Link>
          }
        >
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 5).map((alert, index) => {
                const alertInfo = formatAlertLevel(alert.alertLevel)
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{alertInfo.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {alert.deviceId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {alert.sensorType === 'temperature' && alert.data?.temperature && 
                            `Temperature: ${formatTemperature(alert.data.temperature)}`
                          }
                          {alert.sensorType === 'motion' && 'Motion detected'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${alertInfo.color}-100 text-${alertInfo.color}-800`}>
                        {alertInfo.text}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>No recent alerts</p>
              </div>
            )}
          </div>
        </Card>

        {/* Device Health */}
        <Card 
          title={t('dashboard.deviceHealth')}
          headerActions={
            <Link to="/devices">
              <Button variant="outline" size="small">
                Manage Devices
              </Button>
            </Link>
          }
        >
          <div className="space-y-3">
            {deviceHealth.length > 0 ? (
              deviceHealth.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      device.isOnline ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <div className={`w-16 h-2 bg-gray-200 rounded-full mr-2`}>
                        <div 
                          className={`h-2 rounded-full ${
                            device.healthScore >= 80 ? 'bg-green-500' :
                            device.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${device.healthScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{device.healthScore}%</span>
                    </div>
                    {device.battery && (
                      <p className="text-xs text-gray-500">
                        🔋 {device.battery}%
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏠</div>
                <p>No devices found</p>
                <Link to="/devices">
                  <Button variant="primary" size="small" className="mt-3">
                    {t('dashboard.addDevice')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title={t('dashboard.quickActions')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* <Link to="/devices/new">
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">➕</div>
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-700">
                {t('dashboard.addDevice')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Connect a new monitoring device
              </p>
            </div>
          </Link> */}

          <Link to="/analytics">
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📈</div>
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-700">
                {t('dashboard.viewAnalytics')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View detailed analytics and reports
              </p>
            </div>
          </Link>

          <button 
            onClick={loadDashboardData}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔄</div>
            <h3 className="font-medium text-gray-900 group-hover:text-indigo-700">
              {t('dashboard.systemStatus')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Check system health and status
            </p>
          </button>
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage