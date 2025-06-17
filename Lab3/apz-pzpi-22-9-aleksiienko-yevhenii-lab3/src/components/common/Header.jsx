import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { useSocket } from '../../hooks/useSocket'

const Header = ({ onMenuClick }) => {
  const { user } = useAuth()
  const { language, changeLanguage, getAvailableLanguages, t } = useLanguage()
  const { connected } = useSocket()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const availableLanguages = getAvailableLanguages()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side - Menu button and title */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">
              Smart Monitoring System
            </h1>
          </div>
        </div>

        {/* Right side - Status indicators and language selector */}
        <div className="flex items-center space-x-4">
          {/* Connection status indicator */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-sm text-gray-600 hidden sm:block">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <span className="text-lg mr-1">
                {availableLanguages.find(lang => lang.code === language)?.flag || '🌐'}
              </span>
              <span className="hidden sm:block text-sm">
                {availableLanguages.find(lang => lang.code === language)?.name || 'Language'}
              </span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Language dropdown */}
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code)
                        setShowLanguageMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                        language === lang.code ? 'bg-gray-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="mr-3 text-lg">{lang.flag}</span>
                      {lang.name}
                      {language === lang.code && (
                        <svg className="ml-auto w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.profile?.firstName?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Close language menu on outside click */}
      {showLanguageMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </header>
  )
}

export default Header