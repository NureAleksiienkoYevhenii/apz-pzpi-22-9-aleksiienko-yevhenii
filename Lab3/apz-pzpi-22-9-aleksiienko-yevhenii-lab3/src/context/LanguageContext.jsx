import React, { createContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

export const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value === 'string') {
      // Replace parameters in the string
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match
      })
    }
    
    return key // Return key if translation not found
  }

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage)
    }
  }

  const getAvailableLanguages = () => {
    return Object.keys(translations).map(lang => ({
      code: lang,
      name: translations[lang].language.name,
      flag: translations[lang].language.flag
    }))
  }

  const value = {
    language,
    t,
    changeLanguage,
    getAvailableLanguages
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}