import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getWrongQuestions } from '../api/quizApi'

function WrongQuestionsBook({ wrongQuestions, onRemove, onLoadQuestion }) {
  const { user } = useAuth()
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
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 sticky top-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📕</span>
            <h3 className="font-semibold text-slate-800">错题本</h3>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            {localWrongQuestions.length}
          </span>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {localWrongQuestions.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">🎉</span>
            <p className="text-slate-500">太棒了！还没有错题</p>
            <p className="text-sm text-slate-400 mt-1">继续刷题保持记录哦~</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localWrongQuestions.map((q, index) => (
              <div
                key={`${q.id}-${index}`}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between space-x-2">
                  <button
                    onClick={() => onLoadQuestion(q)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm text-slate-700 line-clamp-2 hover:text-blue-600">
                      {q.question}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-red-500">
                        你的答案：{q.userAnswer}
                      </span>
                      <span className="text-xs text-green-600">
                        正确：{q.answer}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(q.id)
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => {
              if (window.confirm('确定要清空所有错题吗？')) {
                localWrongQuestions.forEach(q => onRemove(q.id))
              }
            }}
            className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
          >
            清空错题
          </button>
        </div>
      )}
    </div>
  )
}

export default WrongQuestionsBook
