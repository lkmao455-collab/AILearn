import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getWrongQuestions, removeWrongQuestion, clearWrongQuestions } from '../api/quizApi'

function WrongQuestionsPage() {
  const { user } = useAuth()
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWrongQuestions()
  }, [])

  const loadWrongQuestions = async () => {
    try {
      setLoading(true)
      const res = await getWrongQuestions()
      setWrongQuestions(res.data || [])
    } catch (error) {
      console.error('加载错题失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (questionId) => {
    try {
      await removeWrongQuestion(questionId)
      setWrongQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (error) {
      console.error('删除错题失败:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有错题吗？')) {
      try {
        await clearWrongQuestions()
        setWrongQuestions([])
      } catch (error) {
        console.error('清空错题失败:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📕</span>
              <h2 className="text-xl font-bold text-slate-800">错题本</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium">
                共 {wrongQuestions.length} 题
              </span>
              {wrongQuestions.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                >
                  清空全部
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {wrongQuestions.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-6xl mb-4 block">🎉</span>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">太棒了！</h3>
              <p className="text-slate-500 mb-6">目前没有错题记录</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                去刷题练习
              </a>
            </div>
          ) : (
            wrongQuestions.map((q, index) => (
              <div key={`${q.id}-${index}`} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                        #{q.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {q.topic}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-4">
                      {q.question}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {q.options.map((opt, i) => {
                        const label = ['A', 'B', 'C', 'D'][i]
                        let className = 'p-3 rounded-lg border '
                        if (label === q.answer) {
                          className += 'bg-green-100 border-green-300 text-green-800'
                        } else if (label === q.userAnswer) {
                          className += 'bg-red-100 border-red-300 text-red-800'
                        } else {
                          className += 'bg-slate-50 border-slate-200 text-slate-500'
                        }
                        return (
                          <div key={i} className={className}>
                            <span className="font-medium">{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-blue-700">解析：</span>
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(q.id)}
                    className="ml-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="移除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default WrongQuestionsPage
