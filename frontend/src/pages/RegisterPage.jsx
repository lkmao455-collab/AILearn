import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { register, login } from '../api/quizApi'

function RegisterPage({ onLogin }) {
  const navigate = useNavigate()
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 验证
    if (!formData.username || !formData.password) {
      setError('请填写用户名和密码')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为 6 位')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      setLoading(true)
      // 注册
      await register(formData.username, formData.password)

      // 注册成功后自动登录
      const res = await login(formData.username, formData.password)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      if (onLogin) onLogin(res.user)

      alert('注册成功！')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark
        ? 'bg-slate-900'
        : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}>CV Learn</span>
          </Link>
          <p className={`mt-2 transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>机器视觉 AI 学习平台</p>
        </div>

        {/* 注册表单 */}
        <div className={`rounded-2xl shadow-xl border overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="px-8 py-6 bg-gradient-to-r from-green-500 to-blue-600">
            <h2 className="text-2xl font-bold text-white text-center">创建账户</h2>
            <p className="text-white/80 text-center mt-1">加入我们，开始学习</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className={`px-4 py-3 rounded-xl text-sm border ${
                isDark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                用户名
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="请输入密码（至少 6 位）"
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                确认密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="请再次输入密码"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                loading
                  ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')
                  : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  注册中...
                </span>
              ) : (
                '创建账户'
              )}
            </button>
          </form>

          <div className={`px-8 py-4 border-t text-center transition-colors duration-300 ${
            isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              已有账户？{' '}
              <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
