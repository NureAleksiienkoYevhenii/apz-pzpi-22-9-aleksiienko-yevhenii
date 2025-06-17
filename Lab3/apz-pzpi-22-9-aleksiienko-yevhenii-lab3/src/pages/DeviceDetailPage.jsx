import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useSocket } from '../hooks/useSocket'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatDateTime, formatTemperature, formatPercentage, formatRelativeTime } from '../utils/formatters'

const DeviceDetailPage = () => {
  const { deviceId } = useParams()
  const [device, setDevice] = useState(null)
  const [sensorData, setSensorData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { t } = useLanguage()
  const { connected, realtimeData, joinDeviceRoom, leaveDeviceRoom } = useSocket()

  useEffect(() => {
    if (deviceId) {
      loadDeviceData()
      joinDeviceRoom(deviceId)
      
      return () => leaveDeviceRoom(deviceId)
    }
  }, [deviceId])

  const loadDeviceData = async () => {
    try {
      setLoading(true)
      
      // Load device info
      const deviceResponse = await api.devices.getById(deviceId)
      if (deviceResponse.success) {
        setDevice(deviceResponse.data.device)
      }
      
      // Load recent sensor data
      const dataResponse = await api.devices.getData(deviceId, { limit: 50 })
      if (dataResponse.success) {
        setSensorData(dataResponse.data.rawData || [])
      }
      
      // Load recent alerts
      const alertsResponse = await api.devices.getAlerts(deviceId, { limit: 20 })
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data.alerts || [])
      }
      
    } catch (err) {
      setError('Failed to load device data')
      console.error('Device detail error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCommand = async (command) => {
    try {
      const response = await api.devices.sendCommand(deviceId, { command })
      if (response.success) {
        // Show success notification
        console.log(`Command ${command} sent successfully`)
      }
    } catch (err) {
      console.error('Command error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          {error || 'Device not found'}
        </div>
        <Link to="/devices">
          <Button variant="outline">
            {t('common.back')} to Devices
          </Button>
        </Link>
      </div>
    )
  }

  const realtimeInfo = realtimeData[deviceId]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'data', name: 'Sensor Data', icon: '📈' },
    { id: 'alerts', name: 'Alerts', icon: '⚠️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/devices" className="mr-4">
            <Button variant="ghost" size="small">
              ← {t('common.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {device.name}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{device.location}</span>
              <span>•</span>
              <span className="font-mono">{device.deviceId}</span>
              <span>•</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  device.status.isOnline ? 'bg-green-400' : 'bg-red-400'
                }`} />
                {device.status.isOnline ? t('devices.online') : t('devices.offline')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {connected && realtimeInfo && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              🟢 Live
            </div>
          )}
          <Button 
            variant="outline" 
            size="small"
            onClick={() => handleCommand('reboot')}
            disabled={!device.status.isOnline}
          >
            🔄 {t('devices.reboot')}
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
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Status */}
          <Card title="Device Status">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${
                  device.status.isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {device.status.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last Seen</span>
                <span className="text-sm text-gray-600">
                  {formatRelativeTime(device.status.lastSeen)}
                </span>
              </div>
              
              {device.status.battery && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery</span>
                  <span className="text-sm text-gray-600">
                    {formatPercentage(device.status.battery.level)}
                  </span>
                </div>
              )}
              
              {device.status.wifi && (
                <div className="flex justify-between">
                  <span className="text-gray-600">WiFi Signal</span>
                  <span className="text-sm text-gray-600">
                    {device.status.wifi.signalStrength || '--'} dBm
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Current Readings */}
          <Card title="Current Readings">
            <div className="space-y-4">
              {realtimeInfo?.data?.temperature && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🌡️</span>
                    <div>
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="text-xl font-semibold text-blue-700">
                        {formatTemperature(realtimeInfo.data.temperature)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {realtimeInfo?.data?.humidity && (
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💧</span>
                    <div>
                      <p className="text-sm text-gray-600">Humidity</p>
                      <p className="text-xl font-semibold text-cyan-700">
                        {formatPercentage(realtimeInfo.data.humidity)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!realtimeInfo && (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">📡</div>
                  <p>No real-time data available</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleCommand('test_sensors')}
                disabled={!device.status.isOnline}
              >
                🧪 {t('devices.testSensors')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleCommand('calibrate')}
                disabled={!device.status.isOnline}
              >
                🎯 {t('devices.calibrate')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleCommand('update_config')}
                disabled={!device.status.isOnline}
              >
                🔧 {t('devices.updateConfig')}
              </Button>
              
              <Button 
                variant="danger" 
                className="w-full justify-start"
                onClick={() => handleCommand('reboot')}
                disabled={!device.status.isOnline}
              >
                🔄 {t('devices.reboot')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'data' && (
        <Card title="Recent Sensor Data">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sensorData.slice(0, 20).map((record, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.sensorType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.sensorType === 'temperature' && record.data.temperature && 
                        formatTemperature(record.data.temperature)
                      }
                      {record.sensorType === 'motion' && 
                        (record.data.motionDetected ? 'Motion Detected' : 'No Motion')
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.alertLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        record.alertLevel === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {record.alertLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sensorData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No sensor data available
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'alerts' && (
        <Card title="Recent Alerts">
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      {alert.alertLevel === 'critical' ? '🚨' : '⚠️'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {alert.sensorType} Alert
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.sensorType === 'temperature' && 
                          `Temperature: ${formatTemperature(alert.data.temperature)}`
                        }
                        {alert.sensorType === 'motion' && 'Motion detected'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    alert.alertLevel === 'critical' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.alertLevel}
                  </span>
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>No alerts found</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card title="Device Settings">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Temperature Sensor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warning Threshold (°C)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue={device.configuration?.sensors?.temperature?.thresholds?.warning || 38}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critical Threshold (°C)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue={device.configuration?.sensors?.temperature?.thresholds?.critical || 40}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Button variant="primary">
                {t('common.save')} Settings
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DeviceDetailPage