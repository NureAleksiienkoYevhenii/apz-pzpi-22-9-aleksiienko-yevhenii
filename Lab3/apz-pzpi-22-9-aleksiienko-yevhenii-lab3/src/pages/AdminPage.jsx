import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatDateTime, formatRelativeTime } from '../utils/formatters'

const AdminPage = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  const [dashboardData, setDashboardData] = useState(null)
  const [systemHealth, setSystemHealth] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      return
    }
    
    loadAdminData()
  }, [user])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'dashboard') {
        const [dashResponse, healthResponse] = await Promise.all([
          api.admin.getDashboard(),
          api.admin.getSystemHealth()
        ])
        
        if (dashResponse.success) setDashboardData(dashResponse.data)
        if (healthResponse.success) setSystemHealth(healthResponse.data)
      } else if (activeTab === 'users') {
        const response = await api.admin.getUsers({ page: 1, limit: 50 })
        if (response.success) setUsers(response.data.users || [])
      }
      
    } catch (err) {
      console.error('Admin data error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData()
    }
  }, [activeTab])

  const runMaintenance = async (task) => {
    try {
      const response = await api.admin.runMaintenance(task)
      if (response.success) {
        console.log('Maintenance completed:', response.data)
        loadAdminData() // Refresh data
      }
    } catch (err) {
      console.error('Maintenance error:', err)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', name: t('admin.title'), icon: '📊' },
    { id: 'users', name: t('admin.users'), icon: '👥' },
    { id: 'system', name: t('admin.systemHealth'), icon: '🔧' },
    { id: 'maintenance', name: t('admin.maintenance'), icon: '⚙️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('admin.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            System administration and monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            systemHealth?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-sm text-gray-600">
            System {systemHealth?.status || 'Unknown'}
          </span>
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
      {!loading && activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="text-white">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <p className="text-blue-100 text-sm">{t('admin.totalUsers')}</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.statistics?.users?.total || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600">
              <div className="text-white">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="text-green-100 text-sm">{t('admin.activeUsers')}</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.statistics?.users?.active || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="text-white">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏠</span>
                  <div>
                    <p className="text-purple-100 text-sm">Total Devices</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.statistics?.devices?.total || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600">
              <div className="text-white">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔗</span>
                  <div>
                    <p className="text-yellow-100 text-sm">Online Devices</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.statistics?.devices?.online || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* System Health */}
          <Card title={t('admin.systemHealth')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  systemHealth?.services?.database?.status === 'operational' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-2xl">
                    {systemHealth?.services?.database?.status === 'operational' ? '✅' : '❌'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">{t('admin.databaseStatus')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {systemHealth?.services?.database?.status || 'Unknown'}
                </p>
                {systemHealth?.services?.database?.responseTime && (
                  <p className="text-xs text-gray-500">
                    {systemHealth.services.database.responseTime}ms
                  </p>
                )}
              </div>

              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  systemHealth?.services?.mqtt?.connected ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-2xl">
                    {systemHealth?.services?.mqtt?.connected ? '✅' : '❌'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">{t('admin.mqttStatus')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {systemHealth?.services?.mqtt?.connected ? t('admin.operational') : 'Disconnected'}
                </p>
              </div>

              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  systemHealth?.services?.ai?.available ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-2xl">
                    {systemHealth?.services?.ai?.available ? '✅' : '❌'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">{t('admin.aiStatus')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {systemHealth?.services?.ai?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Recent Users">
              <div className="space-y-3">
                {dashboardData?.recentActivity?.users?.slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">No recent users</div>
                )}
              </div>
            </Card>

            <Card title="Recent Devices">
              <div className="space-y-3">
                {dashboardData?.recentActivity?.devices?.slice(0, 5).map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.location}</p>
                    </div>
                    <div className="text-right">
                      <div className={`w-3 h-3 rounded-full inline-block mr-2 ${
                        device.status?.isOnline ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm text-gray-600">
                        {device.status?.isOnline ? 'Online' : 'Offline'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(device.createdAt)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">No recent devices</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card title={t('admin.userManagement')}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Devices
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.stats?.devices || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card title="System Metrics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {systemHealth?.metrics?.totalUsers || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Total Users</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {systemHealth?.metrics?.onlineDevices || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Online Devices</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {systemHealth?.metrics?.dataPointsToday || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Data Points Today</p>
              </div>
            </div>
          </Card>

          <Card title="Database Collections">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(systemHealth?.services?.database?.collections || {}).map(([collection, count]) => (
                <div key={collection} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <p className="text-sm text-gray-600 capitalize">{collection}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <Card title={t('admin.maintenance')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Data Maintenance</h3>
                
                <Button
                  variant="outline"
                  onClick={() => runMaintenance('cleanup_old_data')}
                  className="w-full justify-start"
                >
                  🗑️ Cleanup Old Data
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => runMaintenance('update_device_stats')}
                  className="w-full justify-start"
                >
                  📊 Update Device Statistics
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => runMaintenance('check_stale_devices')}
                  className="w-full justify-start"
                >
                  🔍 Check Stale Devices
                </Button>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">System Actions</h3>
                
                <Button
                  variant="outline"
                  onClick={loadAdminData}
                  className="w-full justify-start"
                >
                  🔄 Refresh Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => api.admin.getSystemLogs()}
                  className="w-full justify-start"
                >
                  📋 View System Logs
                </Button>
                
                <Button
                  variant="danger"
                  className="w-full justify-start"
                  disabled
                >
                  ⚠️ Restart Services (Disabled)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminPage