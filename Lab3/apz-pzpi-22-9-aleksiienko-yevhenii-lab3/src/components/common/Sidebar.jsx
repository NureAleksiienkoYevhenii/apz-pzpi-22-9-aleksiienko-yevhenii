import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const navigation = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: '📊'
    },
    {
      name: t('nav.devices'),
      href: '/devices',
      icon: '🏠'
    },
    {
      name: t('nav.analytics'),
      href: '/analytics',
      icon: '📈'
    },
    {
      name: t('nav.profile'),
      href: '/profile',
      icon: '👤'
    }
  ]

  if (user?.role === 'admin') {
    navigation.push({
      name: t('nav.admin'),
      href: '/admin',
      icon: '⚙️'
    })
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-600">
          <div className="flex items-center">
            <div className="text-2xl">🏠</div>
            <h1 className="ml-2 text-xl font-bold text-white">SmartHome</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.profile?.firstName || user?.username}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="mr-3">🚪</span>
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar