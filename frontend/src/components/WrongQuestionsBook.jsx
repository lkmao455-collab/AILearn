import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getWrongQuestions } from '../api/quizApi'

function WrongQuestionsBook({ wrongQuestions, onRemove, onLoadQuestion }) {
  const { user } = useAuth()
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  const [localWrongQuestions, setLocalWrongQuestions] = useState([])

  // 如果已登录，从后端加载错题
  useEffect(() => {
    if (user?.id !== 'guest' && user?.id !== undefined) {
      // 使用后端数据
      setLocalWrongQuestions(wrongQuestions || [])
    } else {
      // 使用本地数据（访客模式）
      setLocalWrongQuestions(wrongQuestions || [])
    }
  }, [wrongQuestions, user])

  return (
    <div className={`rounded-2xl shadow-lg border sticky top-8 transition-colors duration-300 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <div className={`px-6 py-4 border-b rounded-t-2xl transition-colors duration-300 ${
        isDark ? 'border-slate-700 bg-gradient-to-r from-red-900/40 to-orange-900/40' : 'border-slate-200 bg-gradient-to-r from-red-50 to-orange-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📕</span>
            <h3 className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}>错题本</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            {localWrongQuestions.length}
          </span>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {localWrongQuestions.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>太棒了！还没有错题</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>继续刷题保持记录哦~</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localWrongQuestions.map((q, index) => (
              <div
                key={`${q.id}-${index}`}
                className={`p-3 rounded-xl border transition-all duration-200 group ${
                  isDark
                    ? 'bg-slate-700/50 border-slate-600 hover:border-red-500/50 hover:bg-red-900/20'
                    : 'bg-slate-50 border-slate-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <button
                    onClick={() => onLoadQuestion(q)}
                    className="flex-1 text-left"
                  >
                    <p className={`text-sm line-clamp-2 hover:text-blue-400 transition-colors ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {q.question}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-red-400">
                        你的答案：{q.userAnswer}
                      </span>
                      <span className="text-xs text-green-400">
                        正确：{q.answer}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(q.id)
                    }}
                    className={`p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                      isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                    }`}
                    title="移除错题"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {localWrongQuestions.length > 0 && (
        <div className={`px-4 py-3 border-t rounded-b-2xl transition-colors duration-300 ${
          isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={() => {
              if (window.confirm('确定要清空所有错题吗？')) {
                localWrongQuestions.forEach(q => onRemove(q.id))
              }
            }}
            className={`w-full py-2 text-sm rounded-lg transition-colors ${
              isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                : 'text-red-600 hover:text-red-700 hover:bg-red-100'
            }`}
          >
            清空错题
          </button>
        </div>
      )}
    </div>
  )
}

export default WrongQuestionsBook
