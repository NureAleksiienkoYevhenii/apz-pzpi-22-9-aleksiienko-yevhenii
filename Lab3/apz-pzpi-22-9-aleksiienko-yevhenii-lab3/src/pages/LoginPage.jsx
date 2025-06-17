import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import Button from '../components/common/Button'
import { validateEmail } from '../utils/formatters'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
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
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const result = await login(formData.email, formData.password)
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
            {t('auth.loginTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-white text-opacity-80">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red' : 'border-gray'
                } placeholder-gray text-gray focus:outline-none focus:ring-indigo focus:border-indigo focus:z-10 sm:text-sm`}
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red' : 'border-gray'
                } placeholder-gray text-gray focus:outline-none focus:ring-indigo focus:border-indigo focus:z-10 sm:text-sm`}
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-200">{errors.password}</p>
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
              {t('auth.login')}
            </Button>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between">
            <Link
              to="#"
              className="text-sm text-white text-opacity-80 hover:text-white"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <div className="text-center">
            <span className="text-sm text-white text-opacity-80">
              {t('auth.dontHaveAccount')}{' '}
            </span>
            <Link
              to="/register"
              className="text-sm text-white hover:text-opacity-80 font-medium"
            >
              {t('auth.register')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage