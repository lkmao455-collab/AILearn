import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import QuizPage from './pages/QuizPage'
import WrongQuestionsPage from './pages/WrongQuestionsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RankPage from './pages/RankPage'
import AIExplanationPage from './pages/AIExplanationPage'

// 需要登录的路由包装器
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { appliedTheme } = useTheme()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        appliedTheme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${appliedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppContent() {
  const { login, user } = useAuth()
  const { appliedTheme } = useTheme()

  // 根据主题设置背景色
  const pageBgClass = appliedTheme === 'dark'
    ? 'min-h-screen bg-slate-900'
    : 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route path="/register" element={<RegisterPage onLogin={login} />} />

      {/* 需要登录的路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className={pageBgClass}>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <QuizPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wrong"
        element={
          <ProtectedRoute>
            <div className={pageBgClass}>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <WrongQuestionsPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rank"
        element={
          <ProtectedRoute>
            <div className={pageBgClass}>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <RankPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div className={pageBgClass}>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <SettingsPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-explanation"
        element={
          <ProtectedRoute>
            <div className={pageBgClass}>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <AIExplanationPage />
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
