import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import Button from '../components/common/Button'
import { validateEmail, validatePassword } from '../utils/formatters'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const { t, changeLanguage, getAvailableLanguages } = useLanguage()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const result = await register(formData)
      if (!result.success) {
        setErrors({ general: result.message })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Language selector */}
        <div className="flex justify-end">
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-white bg-opacity-20 text-white rounded-md px-3 py-1 text-sm border border-white border-opacity-30"
          >
            {getAvailableLanguages().map(lang => (
              <option key={lang.code} value={lang.code} className="text-gray-900">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Header */}
        <div>
          <div className="flex justify-center">
            <div className="text-6xl mb-4">🏠</div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            {t('auth.registerTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-white text-opacity-80">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <input
                name="username"
                type="text"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t('auth.username')}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-200">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-200">{errors.email}</p>
              )}
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  name="firstName"
                  type="text"
                  required
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={t('auth.firstName')}
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-200">{errors.firstName}</p>
                )}
              </div>
              <div>
                <input
                  name="lastName"
                  type="text"
                  required
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={t('auth.lastName')}
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-200">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <input
                name="phone"
                type="tel"
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.phone')}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <input
                name="password"
                type="password"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-200">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                name="confirmPassword"
                type="password"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t('auth.confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-200">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <div>
            <Button
              type="submit"
              loading={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium"
            >
              {t('auth.register')}
            </Button>
          </div>

          {/* Link to login */}
          <div className="text-center">
            <span className="text-sm text-white text-opacity-80">
              {t('auth.alreadyHaveAccount')}{' '}
            </span>
            <Link
              to="/login"
              className="text-sm text-white hover:text-opacity-80 font-medium"
            >
              {t('auth.login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage