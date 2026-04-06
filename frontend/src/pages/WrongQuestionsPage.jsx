import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getWrongQuestions, removeWrongQuestion, clearWrongQuestions } from '../api/quizApi'
import QuizCard from '../components/QuizCard'
import { checkAnswer } from '../api/quizApi'

function WrongQuestionsPage() {
  const { user } = useAuth()
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  // 从 localStorage 读取错题作为初始值
  const [wrongQuestions, setWrongQuestions] = useState(() => {
    const saved = localStorage.getItem('quiz_wrong_questions')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(true)
  
  // 练习模式状态
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [result, setResult] = useState(null)
  const [practiceStats, setPracticeStats] = useState({ correct: 0, wrong: 0, total: 0 })

  useEffect(() => {
    loadWrongQuestions()
  }, [])

  const loadWrongQuestions = async () => {
    try {
      setLoading(true)
      // 先获取本地存储的错题
      const localWrongQuestions = JSON.parse(localStorage.getItem('quiz_wrong_questions') || '[]')
      
      // 从后端获取错题
      const res = await getWrongQuestions()
      const serverWrongQuestions = res.data || []
      
      // 合并本地和后端的错题数据（去重）
      const merged = [...localWrongQuestions]
      serverWrongQuestions.forEach(sq => {
        if (!merged.find(mq => mq.id === sq.id)) {
          merged.push(sq)
        }
      })
      
      setWrongQuestions(merged)
      // 更新 localStorage
      localStorage.setItem('quiz_wrong_questions', JSON.stringify(merged))
    } catch (error) {
      console.error('加载错题失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (questionId) => {
    try {
      await removeWrongQuestion(questionId)
      setWrongQuestions(prev => {
        const updated = prev.filter(q => q.id !== questionId)
        localStorage.setItem('quiz_wrong_questions', JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.error('删除错题失败:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有错题吗？')) {
      try {
        await clearWrongQuestions()
        setWrongQuestions([])
        localStorage.setItem('quiz_wrong_questions', '[]')
      } catch (error) {
        console.error('清空错题失败:', error)
      }
    }
  }

  // 开始练习模式
  const startPractice = () => {
    if (wrongQuestions.length === 0) return
    setIsPracticeMode(true)
    setCurrentQuestionIndex(0)
    setSelectedIndex(null)
    setResult(null)
    setPracticeStats({ correct: 0, wrong: 0, total: 0 })
  }

  // 退出练习模式
  const exitPractice = () => {
    setIsPracticeMode(false)
    setCurrentQuestionIndex(0)
    setSelectedIndex(null)
    setResult(null)
  }

  // 选择选项
  const handleSelect = (index) => {
    if (result) return
    setSelectedIndex(index)
  }

  // 提交答案
  const handleSubmit = async () => {
    if (selectedIndex === null) return
    
    const currentQuestion = wrongQuestions[currentQuestionIndex]
    const userAnswer = ['A', 'B', 'C', 'D'][selectedIndex]
    
    try {
      const res = await checkAnswer(currentQuestion.id, userAnswer)
      setResult(res.data)
      
      // 更新练习统计
      setPracticeStats(prev => ({
        total: prev.total + 1,
        correct: res.data.isCorrect ? prev.correct + 1 : prev.correct,
        wrong: !res.data.isCorrect ? prev.wrong + 1 : prev.wrong
      }))
      
      // 如果答对了，从错题本中移除
      if (res.data.isCorrect) {
        handleRemove(currentQuestion.id)
      }
    } catch (error) {
      console.error('提交答案失败:', error)
    }
  }

  // 下一题
  const handleNext = () => {
    if (currentQuestionIndex < wrongQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedIndex(null)
      setResult(null)
    } else {
      // 练习完成
      alert(`练习完成！\n共 ${practiceStats.total + 1} 题\n正确: ${practiceStats.correct + (result?.isCorrect ? 1 : 0)}\n错误: ${practiceStats.wrong + (result?.isCorrect ? 0 : 1)}`)
      exitPractice()
    }
  }

  // 打开 AI 解析
  const handleOpenAIExplanation = () => {
    const currentQuestion = wrongQuestions[currentQuestionIndex]
    if (!currentQuestion) return
    
    const apiKey = localStorage.getItem('dashscope_api_key')
    if (!apiKey) {
      alert('请先在设置中配置 DashScope API Key')
      return
    }
    
    const url = `${window.location.origin}/ai-explanation?id=${currentQuestion.id}`
    window.open(url, '_blank')
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
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b transition-colors duration-300 ${
          isDark
            ? 'border-slate-700 bg-gradient-to-r from-red-900/40 to-orange-900/40'
            : 'border-slate-200 bg-gradient-to-r from-red-50 to-orange-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📕</span>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              }`}>错题本</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full font-medium ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                共 {wrongQuestions.length} 题
              </span>
              {wrongQuestions.length > 0 && !isPracticeMode && (
                <>
                  <button
                    onClick={startPractice}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    📝 练习错题
                  </button>
                  <button
                    onClick={handleClearAll}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      isDark
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                    }`}
                  >
                    清空全部
                  </button>
                </>
              )}
              {isPracticeMode && (
                <button
                  onClick={exitPractice}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:text-slate-200 hover:bg-slate-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  退出练习
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`divide-y transition-colors duration-300 ${
          isDark ? 'divide-slate-700' : 'divide-slate-200'
        }`}>
          {wrongQuestions.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-6xl mb-4 block">🎉</span>
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>太棒了！</h3>
              <p className={`mb-6 transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>目前没有错题记录</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                去刷题练习
              </a>
            </div>
          ) : isPracticeMode ? (
            // 练习模式
            <div className="p-6">
              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    进度: {currentQuestionIndex + 1} / {wrongQuestions.length}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    正确: {practiceStats.correct + (result?.isCorrect ? 1 : 0)} | 错误: {practiceStats.wrong + (result?.isCorrect ? 0 : 1)}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div 
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / wrongQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 当前题目 */}
              {wrongQuestions[currentQuestionIndex] && (
                <div>
                  {/* 题目信息 */}
                  <div className="flex items-center space-x-3 mb-4 flex-wrap gap-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{wrongQuestions[currentQuestionIndex].id}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      wrongQuestions[currentQuestionIndex].difficulty === 'easy'
                        ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                        : wrongQuestions[currentQuestionIndex].difficulty === 'medium'
                          ? (isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                          : (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                    }`}>
                      {wrongQuestions[currentQuestionIndex].difficulty === 'easy' ? '简单' : 
                       wrongQuestions[currentQuestionIndex].difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {wrongQuestions[currentQuestionIndex].topic}
                    </span>
                    {wrongQuestions[currentQuestionIndex].subtopic && (
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {wrongQuestions[currentQuestionIndex].subtopic}
                      </span>
                    )}
                  </div>

                  {/* 题目内容 */}
                  <h3 className={`text-lg font-medium mb-6 transition-colors duration-300 ${
                    isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}>
                    {wrongQuestions[currentQuestionIndex].question}
                  </h3>

                  {/* 选项 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {wrongQuestions[currentQuestionIndex].options.map((opt, i) => {
                      const label = ['A', 'B', 'C', 'D'][i]
                      let className = 'p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 '
                      
                      if (result) {
                        // 显示结果状态
                        const correctIndex = ['A', 'B', 'C', 'D'].indexOf(result.correctAnswer?.charAt(0) || result.correctAnswer)
                        if (i === correctIndex) {
                          className += isDark
                            ? 'bg-green-900/30 border-green-500 text-green-200'
                            : 'bg-green-100 border-green-500 text-green-800'
                        } else if (i === selectedIndex && i !== correctIndex) {
                          className += isDark
                            ? 'bg-red-900/30 border-red-500 text-red-200'
                            : 'bg-red-100 border-red-500 text-red-800'
                        } else {
                          className += isDark
                            ? 'bg-slate-700/30 border-slate-600 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }
                      } else if (i === selectedIndex) {
                        className += isDark
                          ? 'bg-blue-900/30 border-blue-500 text-blue-200'
                          : 'bg-blue-100 border-blue-500 text-blue-800'
                      } else {
                        className += isDark
                          ? 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleSelect(i)}
                          disabled={result !== null}
                          className={className}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              result && i === ['A', 'B', 'C', 'D'].indexOf(result.correctAnswer?.charAt(0) || result.correctAnswer)
                                ? (isDark ? 'bg-green-500 text-white' : 'bg-green-500 text-white')
                                : result && i === selectedIndex
                                  ? (isDark ? 'bg-red-500 text-white' : 'bg-red-500 text-white')
                                  : i === selectedIndex
                                    ? (isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white')
                                    : (isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600')
                            }`}>
                              {label}
                            </span>
                            <span className="flex-1 text-left">{opt}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* 结果反馈 */}
                  {result && (
                    <div className={`rounded-xl p-4 mb-6 ${
                      result.isCorrect
                        ? (isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200')
                        : (isDark ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200')
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{result.isCorrect ? '✅' : '❌'}</span>
                        <span className={`font-bold ${
                          result.isCorrect
                            ? (isDark ? 'text-green-300' : 'text-green-700')
                            : (isDark ? 'text-red-300' : 'text-red-700')
                        }`}>
                          {result.isCorrect ? '回答正确！' : '回答错误'}
                        </span>
                        {!result.isCorrect && (
                          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                            正确答案: {result.correctAnswer}
                          </span>
                        )}
                      </div>
                      <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>解析：</span>
                          {result.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleOpenAIExplanation}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark
                          ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      🤖 AI 解析
                    </button>
                    
                    {!result ? (
                      <button
                        onClick={handleSubmit}
                        disabled={selectedIndex === null}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          selectedIndex !== null
                            ? (isDark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600')
                            : (isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')
                        }`}
                      >
                        提交答案
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          isDark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {currentQuestionIndex < wrongQuestions.length - 1 ? '下一题 →' : '完成练习'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 列表模式
            wrongQuestions.map((q, index) => (
              <div key={`${q.id}-${index}`} className={`p-6 transition-colors ${
                isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3 flex-wrap gap-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{q.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        q.difficulty === 'easy'
                          ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
                          : q.difficulty === 'medium'
                            ? (isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                            : (isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
                      }`}>
                        {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {q.topic}
                      </span>
                      {q.subtopic && (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {q.subtopic}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-medium mb-4 transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      {q.question}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {q.options.map((opt, i) => {
                        const label = ['A', 'B', 'C', 'D'][i]
                        let className = 'p-3 rounded-lg border '
                        if (label === q.answer) {
                          className += isDark
                            ? 'bg-green-900/30 border-green-700 text-green-200'
                            : 'bg-green-100 border-green-300 text-green-800'
                        } else if (label === q.userAnswer) {
                          className += isDark
                            ? 'bg-red-900/30 border-red-700 text-red-200'
                            : 'bg-red-100 border-red-300 text-red-800'
                        } else {
                          className += isDark
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }
                        return (
                          <div key={i} className={className}>
                            <span className="font-medium">{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className={`rounded-lg p-4 transition-colors duration-300 ${
                      isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>解析：</span>
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(q.id)}
                    className={`ml-4 p-2 transition-colors ${
                      isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                    }`}
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
