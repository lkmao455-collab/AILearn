import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // 从 localStorage 读取保存的主题，默认跟随系统
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
    return 'system' // 默认跟随系统
  })

  // 计算实际应用的主题（处理 system 情况）
  const [appliedTheme, setAppliedTheme] = useState('light')

  useEffect(() => {
    const updateAppliedTheme = () => {
      let actualTheme = theme
      if (theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      setAppliedTheme(actualTheme)

      // 应用主题到 document
      if (actualTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    updateAppliedTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateAppliedTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setThemeValue = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app_theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue, appliedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
