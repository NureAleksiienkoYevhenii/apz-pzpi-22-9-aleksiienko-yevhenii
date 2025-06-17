const LoadingSpinner = ({ size = 'medium', color = 'indigo', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const colorClasses = {
    indigo: 'border-indigo-500',
    white: 'border-white',
    gray: 'border-gray-500',
    blue: 'border-blue-500'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          border-2 border-solid border-t-transparent
          rounded-full animate-spin
        `}
      />
    </div>
  )
}

export default LoadingSpinner