import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useSocket } from '../hooks/useSocket'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatRelativeTime, formatDeviceStatus, formatPercentage } from '../utils/formatters'

const DevicesPage = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const { t } = useLanguage()
  const { connected, realtimeData } = useSocket()

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      const response = await api.devices.getAll()
      if (response.success) {
        setDevices(response.data.devices || [])
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Failed to load devices')
      console.error('Devices error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceCommand = async (deviceId, command) => {
    try {
      const response = await api.devices.sendCommand(deviceId, { command })
      if (response.success) {
        // Show success notification
        console.log('Command sent successfully')
      }
    } catch (err) {
      console.error('Command error:', err)
    }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'online' && device.status.isOnline) ||
                         (statusFilter === 'offline' && !device.status.isOnline)
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('devices.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your connected monitoring devices
          </p>
        </div>
        <Link to="/devices/new">
          <Button variant="primary">
            <span className="mr-2">➕</span>
            {t('devices.addDevice')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`${t('common.search')} devices...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Devices</option>
              <option value="online">{t('devices.online')}</option>
              <option value="offline">{t('devices.offline')}</option>
            </select>
          </div>
          <Button variant="outline" onClick={loadDevices}>
            <span className="mr-2">🔄</span>
            {t('common.refresh')}
          </Button>
        </div>
      </Card>

      {/* Devices Grid */}
      {error && (
        <Card>
          <div className="text-center py-8 text-red-600">
            Error: {error}
          </div>
        </Card>
      )}

      {!error && filteredDevices.length === 0 && !loading && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No devices found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first device'}
            </p>
            {!searchTerm && (
              <Link to="/devices/new">
                <Button variant="primary">
                  {t('devices.addDevice')}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const realtimeInfo = realtimeData[device.deviceId]
          const statusInfo = formatDeviceStatus(device.status.isOnline ? 'online' : 'offline')
          
          return (
            <Card key={device.deviceId} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Device Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {device.name}
                    </h3>
                    <p className="text-sm text-gray-600">{device.location}</p>
                    <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 bg-${statusInfo.color}-400`} />
                    <span className={`text-sm font-medium text-${statusInfo.color}-700`}>
                      {statusInfo.text}
                    </span>
                  </div>
                </div>

                {/* Device Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🌡️</span>
                      <div>
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="font-medium">
                          {realtimeInfo?.data?.temperature ? 
                            `${realtimeInfo.data.temperature.toFixed(1)}°C` : '--'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🔋</span>
                      <div>
                        <p className="text-xs text-gray-600">{t('devices.battery')}</p>
                        <p className="font-medium">
                          {device.status.battery?.level ? 
                            formatPercentage(device.status.battery.level) : '--'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time indicator */}
                {connected && realtimeInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center text-green-700">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                      <span className="text-xs">
                        Live data • {formatRelativeTime(realtimeInfo.timestamp)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Seen */}
                <div className="text-xs text-gray-500">
                  {t('devices.lastSeen')}: {formatRelativeTime(device.status.lastSeen)}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2 border-t border-gray-200">
                  <Link to={`/devices/${device.deviceId}`} className="flex-1">
                    <Button variant="outline" size="small" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  
                  <div className="relative group">
                    <Button 
                      variant="ghost" 
                      size="small"
                      onClick={() => handleDeviceCommand(device.deviceId, 'reboot')}
                      disabled={!device.status.isOnline}
                    >
                      ⚡
                    </Button>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('devices.reboot')}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <Button 
                      variant="ghost" 
                      size="small"
                      onClick={() => handleDeviceCommand(device.deviceId, 'test_sensors')}
                      disabled={!device.status.isOnline}
                    >
                      🧪
                    </Button>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('devices.testSensors')}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default DevicesPage