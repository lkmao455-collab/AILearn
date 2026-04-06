 import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { checkAnswer, getRandomQuestion, getQuestionsByCategory, getWrongQuestions, removeWrongQuestion, getCategories } from '../api/quizApi'
import QuizCard from '../components/QuizCard'
import WrongQuestionsBook from '../components/WrongQuestionsBook'

function QuizPage() {
  const { user } = useAuth()
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  // 错题本 - 从 localStorage 读取
  const [wrongQuestions, setWrongQuestions] = useState(() => {
    const saved = localStorage.getItem('quiz_wrong_questions')
    return saved ? JSON.parse(saved) : []
  })
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [categoryStats, setCategoryStats] = useState({ topics: [], difficulties: [] })

  // 分类筛选状态 - 从 localStorage 读取（必须在使用前定义）
  const [selectedTopic, setSelectedTopic] = useState(() => {
    return localStorage.getItem('quiz_selected_topic') || null
  })
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
    return localStorage.getItem('quiz_selected_difficulty') || null
  })

  // 做题统计 - 按分类存储，从 localStorage 读取
  const [statsByCategory, setStatsByCategory] = useState(() => {
    const saved = localStorage.getItem('quiz_stats_by_category')
    return saved ? JSON.parse(saved) : {}
  })

  // 已做题目记录 - 按分类+难度存储，防止重复做题
  const [answeredQuestionsByCategory, setAnsweredQuestionsByCategory] = useState(() => {
    const saved = localStorage.getItem('quiz_answered_questions_by_category')
    return saved ? JSON.parse(saved) : {}
  })

  // 获取当前分类的统计（如果没有则返回默认值）
  const currentCategoryKey = selectedTopic || 'all'
  const currentDifficultyKey = selectedDifficulty || 'all'
  const fullCategoryKey = `${currentCategoryKey}_${currentDifficultyKey}`
  const stats = statsByCategory[fullCategoryKey] || { correct: 0, wrong: 0, total: 0 }
  const answeredQuestionIds = answeredQuestionsByCategory[fullCategoryKey] || []

  // 做题统计变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('quiz_stats_by_category', JSON.stringify(statsByCategory))
  }, [statsByCategory])

  // 已做题目记录变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('quiz_answered_questions_by_category', JSON.stringify(answeredQuestionsByCategory))
  }, [answeredQuestionsByCategory])

  // 错题本变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('quiz_wrong_questions', JSON.stringify(wrongQuestions))
  }, [wrongQuestions])
  const [filteredQuestions, setFilteredQuestions] = useState([])

  // 加载错题本（从后端）和总题数
  useEffect(() => {
    if (user?.id !== 'guest' && user?.id !== undefined) {
      loadWrongQuestions()
    }
    // 获取总题数
    loadTotalQuestions()
  }, [user])

  const loadTotalQuestions = async () => {
    try {
      const res = await getCategories()
      if (res.data && res.data.total) {
        setTotalQuestions(res.data.total)
      }
    } catch (error) {
      console.error('获取总题数失败:', error)
    }
  }

  const loadWrongQuestions = async () => {
    try {
      const res = await getWrongQuestions()
      const serverWrongQuestions = res.data || []
      // 合并本地和后端的错题数据（以本地为主，避免覆盖）
      setWrongQuestions(prev => {
        const localWrongQuestions = prev || []
        // 合并两个数组，去重（基于 id）
        const merged = [...localWrongQuestions]
        serverWrongQuestions.forEach(sq => {
          if (!merged.find(mq => mq.id === sq.id)) {
            merged.push(sq)
          }
        })
        return merged
      })
    } catch (error) {
      console.error('加载错题失败:', error)
    }
  }

  // 获取分类后的题目
  const fetchFilteredQuestions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getQuestionsByCategory(selectedTopic, selectedDifficulty)
      setFilteredQuestions(res.data || [])
    } catch (error) {
      console.error('获取题目列表失败:', error)
      setFilteredQuestions([])
    } finally {
      setLoading(false)
    }
  }, [selectedTopic, selectedDifficulty])

  // 从过滤后的题目中随机选择（排除已做题目）
  const fetchQuestion = useCallback(async () => {
    if (filteredQuestions.length === 0) {
      try {
        const res = await getRandomQuestion()
        setCurrentQuestion(res.data)
      } catch (error) {
        console.error('获取题目失败:', error)
      } finally {
        setLoading(false)
      }
      return
    }

    // 过滤掉已做的题目
    const unansweredQuestions = filteredQuestions.filter(
      q => !answeredQuestionIds.includes(q.id)
    )

    // 如果当前分类下所有题目都已做完
    if (unansweredQuestions.length === 0) {
      setCurrentQuestion(null)
      setSelectedIndex(null)
      setResult(null)
      alert(`当前分类（${selectedTopic || '全部'} / ${selectedDifficulty || '全部难度'}）的题目已全部做完！\n\n您可以选择：\n1. 清理做题记录重新开始\n2. 切换其他分类继续做题`)
      return
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length)
    setCurrentQuestion(unansweredQuestions[randomIndex])
    setSelectedIndex(null)
    setResult(null)
  }, [filteredQuestions, answeredQuestionIds, selectedTopic, selectedDifficulty])

  // 筛选条件变化时重新获取题目列表
  useEffect(() => {
    fetchFilteredQuestions()
  }, [fetchFilteredQuestions])

  // 初始加载或筛选变化后获取题目
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      fetchQuestion()
    }
  }, [filteredQuestions.length])

  // 选择选项
  const handleSelect = (index) => {
    if (result) return
    setSelectedIndex(index)
  }

  // 提交答案
  const handleSubmit = async () => {
    if (selectedIndex === null || !currentQuestion) return

    try {
      const userAnswer = ['A', 'B', 'C', 'D'][selectedIndex]
      const res = await checkAnswer(currentQuestion.id, userAnswer)
      setResult(res.data)
      
      // 更新当前分类的统计
      setStatsByCategory(prev => {
        const currentStats = prev[fullCategoryKey] || { correct: 0, wrong: 0, total: 0 }
        return {
          ...prev,
          [fullCategoryKey]: {
            ...currentStats,
            total: currentStats.total + 1,
            correct: res.data.isCorrect ? currentStats.correct + 1 : currentStats.correct,
            wrong: !res.data.isCorrect ? currentStats.wrong + 1 : currentStats.wrong
          }
        }
      })

      // 记录已做题目ID（按分类+难度）
      setAnsweredQuestionsByCategory(prev => {
        const currentAnswered = prev[fullCategoryKey] || []
        if (currentAnswered.includes(currentQuestion.id)) {
          return prev
        }
        return {
          ...prev,
          [fullCategoryKey]: [...currentAnswered, currentQuestion.id]
        }
      })

      // 后端已自动记录错题和做题记录
      // 前端只需更新本地显示
      if (!res.data.isCorrect) {
        setWrongQuestions(prev => {
          const exists = prev.find(q => q.id === currentQuestion.id)
          if (exists) return prev
          return [...prev, { ...currentQuestion, userAnswer }]
        })
      }
    } catch (error) {
      console.error('提交答案失败:', error)
    }
  }

  // 打开 AI 解析新窗口
  const handleOpenAIExplanation = () => {
    if (!currentQuestion) {
      console.log('[QuizPage] handleOpenAIExplanation: currentQuestion is null')
      return
    }
    const apiKey = localStorage.getItem('dashscope_api_key')
    if (!apiKey) {
      console.log('[QuizPage] handleOpenAIExplanation: API Key not found')
      alert('请先在设置中配置 DashScope API Key')
      return
    }
    console.log('[QuizPage] handleOpenAIExplanation: Opening URL with questionId:', currentQuestion.id)
    // 打开新窗口，传递题目 ID 作为 URL 参数
    const url = `${window.location.origin}/ai-explanation?id=${currentQuestion.id}`
    console.log('[QuizPage] handleOpenAIExplanation: URL:', url)
    window.open(url, '_blank')
  }

  // 下一题
  const handleNext = () => {
    fetchQuestion()
  }

  // 从错题本删除
  const handleRemoveFromWrong = async (questionId) => {
    if (user?.id !== 'guest') {
      try {
        await removeWrongQuestion(questionId)
      } catch (error) {
        console.error('删除错题失败:', error)
      }
    }
    setWrongQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 主内容区 */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <QuizCard
            question={currentQuestion}
            selectedIndex={selectedIndex}
            result={result}
            onSelect={handleSelect}
            onSubmit={handleSubmit}
            onAIExplain={handleOpenAIExplanation}
            onNext={handleNext}
            aiLoading={false}
            aiExplanation={null}
          />
        </div>
        <div className="space-y-4">
          {/* 错题本已隐藏 - 保留状态逻辑但不在UI显示
          <WrongQuestionsBook
            wrongQuestions={wrongQuestions}
            onRemove={handleRemoveFromWrong}
            onLoadQuestion={(q) => {
              setCurrentQuestion(q)
              setSelectedIndex(null)
              setResult(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
          */}
          {/* 统计信息 */}
          <div className={`rounded-xl shadow-md p-4 border transition-colors duration-300 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>📊 做题统计</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>已做题数</div>
                <div className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{stats.total}</div>
              </div>
              <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>未做题数</div>
                <div className="text-xl font-bold text-orange-500">{Math.max(0, filteredQuestions.length - stats.total)}</div>
              </div>
              <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>正确</div>
                <div className="text-xl font-bold text-green-500">{stats.correct}</div>
              </div>
              <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                isDark ? 'bg-slate-700/50' : 'bg-slate-50'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>错误</div>
                <div className="text-xl font-bold text-red-500">{stats.wrong}</div>
              </div>
            </div>
            {stats.total > 0 && (
              <div className={`mt-3 pt-3 border-t transition-colors duration-300 ${
                isDark ? 'border-slate-700' : 'border-slate-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>正确率</span>
                  <span className="text-lg font-bold text-blue-500">
                    {((stats.correct / stats.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={`mt-2 w-full rounded-full h-2 transition-colors duration-300 ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}>
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizPage
