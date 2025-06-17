const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  headerActions,
  padding = 'default',
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  }

  const baseClasses = `bg-white rounded-lg shadow-sm border border-gray-200 ${
    hover ? 'hover:shadow-md transition-shadow' : ''
  }`

  return (
    <div className={`${baseClasses} ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]} pb-4 mb-4`}>
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={title || subtitle || headerActions ? paddingClasses[padding] : paddingClasses[padding]}>
        {children}
      </div>
    </div>
  )
}

export default Card