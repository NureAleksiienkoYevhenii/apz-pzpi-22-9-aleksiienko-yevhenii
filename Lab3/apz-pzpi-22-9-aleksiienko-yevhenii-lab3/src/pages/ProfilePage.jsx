import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { api } from '../services/api'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { validateEmail } from '../utils/formatters'

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const { t, language, changeLanguage, getAvailableLanguages } = useLanguage()
  
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState(null)
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    timezone: user?.profile?.timezone || 'UTC'
  })

  const [preferencesForm, setPreferencesForm] = useState({
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? true,
      temperature_alerts: user?.preferences?.notifications?.temperature_alerts ?? true,
      motion_alerts: user?.preferences?.notifications?.motion_alerts ?? true
    },
    thresholds: {
      temperature_warning: user?.preferences?.thresholds?.temperature_warning || 38.0,
      temperature_critical: user?.preferences?.thresholds?.temperature_critical || 40.0
    }
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    try {
      const response = await api.auth.getStats()
      if (response.success) {
        setUserStats(response.data)
      }
    } catch (err) {
      console.error('Stats error:', err)
    }
  }

  const handlePersonalSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const result = await updateProfile(personalForm)
      if (result.success) {
        setSuccess('Profile updated successfully!')
      } else {
        setErrors({ general: result.message })
      }
    } catch (error) {
      setErrors({ general: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const result = await updateProfile({ preferences: preferencesForm })
      if (result.success) {
        setSuccess('Preferences updated successfully!')
      } else {
        setErrors({ general: result.message })
      }
    } catch (error) {
      setErrors({ general: 'Failed to update preferences' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords
    const newErrors = {}
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const response = await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      if (response.success) {
        setSuccess('Password changed successfully!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setErrors({ general: response.message })
      }
    } catch (error) {
      setErrors({ general: 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', name: t('profile.personalInfo'), icon: '👤' },
    { id: 'preferences', name: t('profile.preferences'), icon: '⚙️' },
    { id: 'security', name: t('profile.security'), icon: '🔒' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('profile.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-medium">
              {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

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

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <Card title={t('profile.personalInfo')}>
          <form onSubmit={handlePersonalSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.firstName')}
                </label>
                <input
                  type="text"
                  value={personalForm.firstName}
                  onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.lastName')}
                </label>
                <input
                  type="text"
                  value={personalForm.lastName}
                  onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={personalForm.phone}
                onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.timezone')}
              </label>
              <select
                value={personalForm.timezone}
                onChange={(e) => setPersonalForm({ ...personalForm, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Europe/Kiev">Kiev</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.language')}
              </label>
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {getAvailableLanguages().map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" loading={loading}>
                {t('common.save')} Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card title={t('profile.preferences')}>
          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            {/* Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('profile.notifications')}
              </h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications.email}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      notifications: {
                        ...preferencesForm.notifications,
                        email: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('profile.emailNotifications')}
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications.push}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      notifications: {
                        ...preferencesForm.notifications,
                        push: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('profile.pushNotifications')}
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications.temperature_alerts}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      notifications: {
                        ...preferencesForm.notifications,
                        temperature_alerts: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('profile.temperatureAlerts')}
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications.motion_alerts}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      notifications: {
                        ...preferencesForm.notifications,
                        motion_alerts: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('profile.motionAlerts')}
                  </span>
                </label>
              </div>
            </div>

            {/* Alert Thresholds */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Alert Thresholds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Warning (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={preferencesForm.thresholds.temperature_warning}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      thresholds: {
                        ...preferencesForm.thresholds,
                        temperature_warning: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Critical (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={preferencesForm.thresholds.temperature_critical}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      thresholds: {
                        ...preferencesForm.thresholds,
                        temperature_critical: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" loading={loading}>
                {t('common.save')} Preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card title={t('profile.security')}>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.currentPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.newPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" loading={loading}>
                {t('profile.changePassword')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card title="Your Devices">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {userStats?.devices || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Connected devices</p>
            </div>
          </Card>
          
          <Card title="Data Points (24h)">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {userStats?.recentData || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Last 24 hours</p>
            </div>
          </Card>
          
          <Card title="Weekly Alerts">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {userStats?.weeklyAlerts || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Past 7 days</p>
            </div>
          </Card>
          
          <Card title="Member Since">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {userStats?.memberSince ? 
                  new Date(userStats.memberSince).toLocaleDateString() : '--'
                }
              </div>
              <p className="text-sm text-gray-600 mt-1">Join date</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProfilePage