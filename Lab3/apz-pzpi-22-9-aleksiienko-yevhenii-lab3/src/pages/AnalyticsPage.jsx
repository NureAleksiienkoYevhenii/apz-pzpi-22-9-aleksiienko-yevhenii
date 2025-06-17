import { useState, useEffect } from 'react'
import { useLanguage } from '../hooks/useLanguage'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatTemperature, formatDateTime } from '../utils/formatters'

const AnalyticsPage = () => {
  const [temperatureData, setTemperatureData] = useState(null)
  const [motionData, setMotionData] = useState(null)
  const [alertsData, setAlertsData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('temperature')
  const [timeRange, setTimeRange] = useState('7d')
  
  const { t } = useLanguage()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
      }

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: timeRange === '24h' ? 'hour' : 'day'
      }

      // Load different types of analytics
      const [tempResponse, motionResponse, alertsResponse, recsResponse] = await Promise.all([
        api.analytics.getTemperature(params),
        api.analytics.getMotion(params),
        api.analytics.getAlerts(params),
        api.analytics.getRecommendations()
      ])

      if (tempResponse.success) setTemperatureData(tempResponse.data)
      if (motionResponse.success) setMotionData(motionResponse.data)
      if (alertsResponse.success) setAlertsData(alertsResponse.data)
      if (recsResponse.success) setRecommendations(recsResponse.data.recommendations || [])
      
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const params = { timeRange, format: 'json' }
      const response = await api.analytics.exportData(params)
      
      // Create download
      const blob = new Blob([JSON.stringify(response, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${timeRange}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const tabs = [
    { id: 'temperature', name: t('analytics.temperature'), icon: '🌡️' },
    { id: 'motion', name: t('analytics.motion'), icon: '🚶' },
    { id: 'alerts', name: t('analytics.alerts'), icon: '⚠️' },
    { id: 'recommendations', name: t('analytics.recommendations'), icon: '🤖' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('analytics.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Detailed analytics and insights for your monitoring system
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="24h">{t('analytics.last24Hours')}</option>
            <option value="7d">{t('analytics.last7Days')}</option>
            <option value="30d">{t('analytics.last30Days')}</option>
          </select>
          
          <Button variant="outline" onClick={exportData}>
            📥 {t('analytics.export')}
          </Button>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            🔄 {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Tab Content */}
      {!loading && activeTab === 'temperature' && (
        <div className="space-y-6">
          {/* Temperature Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card title="Average Temperature">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {temperatureData?.statistics?.avgTemperature ? 
                    formatTemperature(temperatureData.statistics.avgTemperature) : '--'
                  }
                </div>
                <p className="text-sm text-gray-600 mt-1">Overall average</p>
              </div>
            </Card>
            
            <Card title="Maximum Temperature">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {temperatureData?.statistics?.maxTemperature ? 
                    formatTemperature(temperatureData.statistics.maxTemperature) : '--'
                  }
                </div>
                <p className="text-sm text-gray-600 mt-1">Highest recorded</p>
              </div>
            </Card>
            
            <Card title="Minimum Temperature">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600">
                  {temperatureData?.statistics?.minTemperature ? 
                    formatTemperature(temperatureData.statistics.minTemperature) : '--'
                  }
                </div>
                <p className="text-sm text-gray-600 mt-1">Lowest recorded</p>
              </div>
            </Card>
            
            <Card title="Data Points">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {temperatureData?.statistics?.totalDataPoints || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Total readings</p>
              </div>
            </Card>
          </div>

          {/* Temperature by Device */}
          <Card title="Temperature by Device">
            <div className="space-y-4">
              {temperatureData?.devices?.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{device.name}</h4>
                    <p className="text-sm text-gray-600">{device.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {device.statistics?.avgTemperature ? 
                        formatTemperature(device.statistics.avgTemperature) : '--'
                      }
                    </div>
                    <p className="text-xs text-gray-500">
                      {device.statistics?.dataPoints || 0} readings
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No temperature data available
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'motion' && (
        <div className="space-y-6">
          {/* Motion Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Total Motion Events">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {motionData?.patterns?.reduce((sum, p) => sum + (p.motionEvents || 0), 0) || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">In selected period</p>
              </div>
            </Card>
            
            <Card title="Active Locations">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {motionData?.locationActivity?.length || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Locations with activity</p>
              </div>
            </Card>
            
            <Card title="Peak Activity Hour">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {motionData?.hourlyDistribution?.reduce((peak, hour) => 
                    hour.motionEvents > (peak?.motionEvents || 0) ? hour : peak, null
                  )?._id || '--'}:00
                </div>
                <p className="text-sm text-gray-600 mt-1">Most active time</p>
              </div>
            </Card>
          </div>

          {/* Motion by Location */}
          <Card title="Motion Activity by Location">
            <div className="space-y-4">
              {motionData?.locationActivity?.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{location._id || 'Unknown'}</h4>
                    <p className="text-sm text-gray-600">
                      {location.devices?.length || 0} device(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {location.motionEvents || 0}
                    </div>
                    <p className="text-xs text-gray-500">motion events</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No motion data available
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Total Alerts">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {alertsData?.summary?.totalAlerts || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">In selected period</p>
              </div>
            </Card>
            
            <Card title="Critical Alerts">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-700">
                  {alertsData?.alertsBySeverity?.find(s => s._id === 'critical')?.count || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Requiring immediate attention</p>
              </div>
            </Card>
            
            <Card title="Warning Alerts">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {alertsData?.alertsBySeverity?.find(s => s._id === 'warning')?.count || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Monitoring required</p>
              </div>
            </Card>
          </div>

          {/* Recent Critical Alerts */}
          <Card title="Recent Critical Alerts">
            <div className="space-y-4">
              {alertsData?.recentCriticalAlerts?.map((alert, index) => (
                <div key={index} className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-2xl mr-3">🚨</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-red-900">
                        {alert.deviceId} - {alert.sensorType}
                      </h4>
                      <span className="text-xs text-red-600">
                        {formatDateTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {alert.sensorType === 'temperature' && alert.data?.temperature && 
                        `Temperature: ${formatTemperature(alert.data.temperature)}`
                      }
                      {alert.sensorType === 'motion' && 'Motion detected in restricted area'}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No critical alerts in this period</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <Card title="AI-Powered Recommendations">
            <div className="space-y-6">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                      rec.priority === 'high' ? 'bg-red-100' :
                      rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-2xl">
                        {rec.category === 'energy' ? '⚡' :
                         rec.category === 'security' ? '🔒' :
                         rec.category === 'comfort' ? '🏠' :
                         rec.category === 'maintenance' ? '🔧' : '💡'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {rec.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {rec.description}
                      </p>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Recommended Action:
                        </p>
                        <p className="text-sm text-gray-700">
                          {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {recommendations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    AI Recommendations
                  </h3>
                  <p className="text-gray-600 mb-4">
                    AI-powered recommendations will appear here based on your system data
                  </p>
                  <p className="text-sm text-gray-500">
                    Recommendations are generated based on device performance, usage patterns, and optimization opportunities
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage