import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import Button from '../components/common/Button'

const NotFoundPage = () => {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-9xl mb-4">🤖</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-4">
            <Link to="/dashboard">
              <Button variant="primary" className="w-full">
                🏠 Go to Dashboard
              </Button>
            </Link>
            
            <Link to="/devices">
              <Button variant="outline" className="w-full">
                📱 View Devices
              </Button>
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="w-full text-indigo-600 hover:text-indigo-500 text-sm"
            >
              ← {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage