import { useState, useEffect } from 'react'
import { testApiKeyConnection, generateQuestionByAI } from '../api/quizApi'
import { useTheme } from '../contexts/ThemeContext'

function SettingsPage() {
  const { theme, setTheme, appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'

  // 主题选项配置 - 确保高对比度
  const themeOptions = [
    {
      value: 'light',
      label: '浅色模式',
      icon: '☀️',
      description: '明亮的界面风格',
      selectedBg: 'bg-blue-500',
      selectedBorder: 'border-blue-600',
      unselectedBg: 'bg-slate-100',
      unselectedBorder: 'border-slate-300',
      unselectedText: 'text-slate-700'
    },
    {
      value: 'dark',
      label: '深色模式',
      icon: '🌙',
      description: '暗色的界面风格',
      selectedBg: 'bg-indigo-500',
      selectedBorder: 'border-indigo-400',
      unselectedBg: 'bg-slate-800',
      unselectedBorder: 'border-slate-600',
      unselectedText: 'text-slate-200'
    },
    {
      value: 'system',
      label: '跟随系统',
      icon: '🖥️',
      description: '自动切换浅色/深色',
      selectedBg: 'bg-purple-500',
      selectedBorder: 'border-purple-600',
      unselectedBg: 'bg-slate-100',
      unselectedBorder: 'border-slate-300',
      unselectedText: 'text-slate-700'
    }
  ]

  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)
  const [testLog, setTestLog] = useState('')

  // 题目类型设置
  const [categories, setCategories] = useState({
    topics: [],
    difficulties: []
  })
  const [selectedTopic, setSelectedTopic] = useState(() => {
    return localStorage.getItem('quiz_selected_topic') || null
  })
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
    return localStorage.getItem('quiz_selected_difficulty') || null
  })

  // 验证对话框状态
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyText, setVerifyText] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [pendingTopic, setPendingTopic] = useState(null)
  const [pendingDifficulty, setPendingDifficulty] = useState(null)

  // 清理记录验证对话框状态
  const [showClearVerifyDialog, setShowClearVerifyDialog] = useState(false)
  const [clearVerifyText, setClearVerifyText] = useState('')
  const [clearVerifyError, setClearVerifyError] = useState('')
  const [clearType, setClearType] = useState(null) // 'current' 或 'all'

  // 做题记录数据
  const [answeredQuestionsByCategory, setAnsweredQuestionsByCategory] = useState(() => {
    const saved = localStorage.getItem('quiz_answered_questions_by_category')
    return saved ? JSON.parse(saved) : {}
  })
  const [statsByCategory, setStatsByCategory] = useState(() => {
    const saved = localStorage.getItem('quiz_stats_by_category')
    return saved ? JSON.parse(saved) : {}
  })

  // AI 生成新题状态
  const [aiGenerateLoading, setAiGenerateLoading] = useState(false)
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false)
  const [aiGenerateParams, setAiGenerateParams] = useState({
    topic: '',
    difficulty: 'medium',
    count: 1
  })
  const [aiGenerateResult, setAiGenerateResult] = useState(null)

  // 加载已保存的 API Key 和分类
  useEffect(() => {
    const savedKey = localStorage.getItem('dashscope_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
    fetchCategories()
  }, [selectedTopic])

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      // 根据选中的 topic 获取对应的难度统计
      const url = selectedTopic 
        ? `http://localhost:3001/api/questions/categories?topic=${encodeURIComponent(selectedTopic)}`
        : 'http://localhost:3001/api/questions/categories'
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setCategories({
          topics: result.data.topics,
          difficulties: result.data.difficulties
        })
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 保存 API Key
  const handleSave = () => {
    if (!apiKey || apiKey.trim() === '') {
      setError('API Key 不能为空')
      return
    }

    // 简单的格式验证
    if (!apiKey.startsWith('sk-')) {
      setError('API Key 格式不正确，应该以 sk- 开头')
      return
    }

    localStorage.setItem('dashscope_api_key', apiKey.trim())
    setSaved(true)
    setError('')

    // 3 秒后清除成功提示
    setTimeout(() => setSaved(false), 3000)
  }

  // 清除 API Key
  const handleClear = () => {
    localStorage.removeItem('dashscope_api_key')
    setApiKey('')
    setSaved(false)
    setError('')
    setTestLog('')
  }

  // 测试 API Key 连接
  const handleTest = async () => {
    if (!apiKey || apiKey.trim() === '') {
      setError('API Key 不能为空，请先输入 API Key')
      return
    }

    setTesting(true)
    setTestLog('🔄 正在测试连接...\n')
    setError('')

    try {
      const result = await testApiKeyConnection(apiKey.trim())

      const logMessage = `✅ 连接测试成功！\n⏰ 时间：${new Date().toLocaleString('zh-CN')}\n📝 消息：${result.message}`
      setTestLog(logMessage)

      if (result.success) {
        setSaved(true)
        localStorage.setItem('dashscope_api_key', apiKey.trim())
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '未知错误'
      const errorDetails = err.response?.data?.details || ''

      const logMessage = `❌ 连接测试失败！\n⏰ 时间：${new Date().toLocaleString('zh-CN')}\n🚨 错误：${errorMessage}\n${errorDetails ? `📋 详情：${JSON.stringify(errorDetails, null, 2)}` : ''}`
      setTestLog(logMessage)
      setError(errorMessage)
    } finally {
      setTesting(false)
    }
  }

  // 打开验证对话框
  const openVerifyDialog = (topic, difficulty) => {
    setPendingTopic(topic)
    setPendingDifficulty(difficulty)
    setVerifyText('')
    setVerifyError('')
    setShowVerifyDialog(true)
  }

  // 验证并切换题目类型
  const handleVerifyAndSwitch = () => {
    const requiredText = '我真的已经学会当前题型了'
    if (verifyText.trim() !== requiredText) {
      setVerifyError('输入不正确，请重新输入')
      return
    }

    // 保存新的设置
    if (pendingTopic !== undefined) {
      if (pendingTopic === null) {
        localStorage.removeItem('quiz_selected_topic')
        setSelectedTopic(null)
      } else {
        localStorage.setItem('quiz_selected_topic', pendingTopic)
        setSelectedTopic(pendingTopic)
      }
    }

    if (pendingDifficulty !== undefined) {
      if (pendingDifficulty === null) {
        localStorage.removeItem('quiz_selected_difficulty')
        setSelectedDifficulty(null)
      } else {
        localStorage.setItem('quiz_selected_difficulty', pendingDifficulty)
        setSelectedDifficulty(pendingDifficulty)
      }
    }

    setShowVerifyDialog(false)
    setVerifyText('')
    setVerifyError('')
    setPendingTopic(null)
    setPendingDifficulty(null)

    // 显示成功提示
    alert('题目类型已切换！刷新页面后生效')
  }

  // 处理题目类型变更
  const handleTopicChange = (topic) => {
    if (topic === selectedTopic) return
    openVerifyDialog(topic, undefined)
  }

  // 处理难度变更
  const handleDifficultyChange = (difficulty) => {
    if (difficulty === selectedDifficulty) return
    openVerifyDialog(undefined, difficulty)
  }

  // 清除筛选
  const handleClearFilter = () => {
    if (selectedTopic === null && selectedDifficulty === null) return
    openVerifyDialog(null, null)
  }

  // 打开 AI 生成对话框
  const openAIGenerateDialog = () => {
    const apiKey = localStorage.getItem('dashscope_api_key')
    if (!apiKey) {
      alert('请先在设置中配置 DashScope API Key')
      return
    }
    setAiGenerateParams({
      topic: selectedTopic || '',
      difficulty: selectedDifficulty || 'medium',
      count: 1
    })
    setAiGenerateResult(null)
    setShowAIGenerateDialog(true)
  }

  // AI 生成新题
  const handleAIGenerate = async () => {
    try {
      setAiGenerateLoading(true)
      setAiGenerateResult(null)

      const apiKey = localStorage.getItem('dashscope_api_key')
      const res = await generateQuestionByAI(
        aiGenerateParams.topic,
        aiGenerateParams.difficulty,
        apiKey,
        aiGenerateParams.count
      )

      setAiGenerateResult({
        success: true,
        message: `成功生成 ${aiGenerateParams.count} 道题目！`,
        data: res.data
      })
    } catch (error) {
      console.error('AI 出题失败:', error)
      setAiGenerateResult({
        success: false,
        message: error.response?.data?.message || 'AI 出题失败，请重试'
      })
    } finally {
      setAiGenerateLoading(false)
    }
  }

  // 打开清理验证对话框
  const openClearVerifyDialog = (type) => {
    setClearType(type)
    setClearVerifyText('')
    setClearVerifyError('')
    setShowClearVerifyDialog(true)
  }

  // 验证并清理做题记录
  const handleVerifyAndClear = () => {
    const requiredText = '我确定要重新学习一遍'
    if (clearVerifyText.trim() !== requiredText) {
      setClearVerifyError('输入不正确，请重新输入')
      return
    }

    const currentCategoryKey = selectedTopic || 'all'
    const currentDifficultyKey = selectedDifficulty || 'all'
    const fullCategoryKey = `${currentCategoryKey}_${currentDifficultyKey}`

    if (clearType === 'current') {
      // 清理当前分类的记录
      const newAnswered = { ...answeredQuestionsByCategory }
      delete newAnswered[fullCategoryKey]
      setAnsweredQuestionsByCategory(newAnswered)
      localStorage.setItem('quiz_answered_questions_by_category', JSON.stringify(newAnswered))

      const newStats = { ...statsByCategory }
      delete newStats[fullCategoryKey]
      setStatsByCategory(newStats)
      localStorage.setItem('quiz_stats_by_category', JSON.stringify(newStats))

      alert(`已清理当前分类（${selectedTopic || '全部'} / ${selectedDifficulty || '全部难度'}）的做题记录`)
    } else if (clearType === 'all') {
      // 清理所有记录
      setAnsweredQuestionsByCategory({})
      setStatsByCategory({})
      localStorage.removeItem('quiz_answered_questions_by_category')
      localStorage.removeItem('quiz_stats_by_category')
      alert('已清理所有做题记录')
    }

    setShowClearVerifyDialog(false)
    setClearVerifyText('')
    setClearVerifyError('')
    setClearType(null)
  }

  const difficultyColors = {
    easy: isDark
      ? 'bg-green-900/50 text-green-300 border-green-700 hover:bg-green-900/70'
      : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    medium: isDark
      ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700 hover:bg-yellow-900/70'
      : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    hard: isDark
      ? 'bg-red-900/50 text-red-300 border-red-700 hover:bg-red-900/70'
      : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
  }

  const difficultyColorsSelected = {
    easy: 'bg-green-500 text-white border-green-600',
    medium: 'bg-yellow-500 text-white border-yellow-600',
    hard: 'bg-red-500 text-white border-red-600'
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* 主题设置 */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* 头部 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">🎨 外观设置</h1>
          <p className="text-indigo-100 text-sm mt-1">选择你喜欢的界面主题</p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 当前主题显示 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>当前主题</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                theme === 'system'
                  ? (isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                  : (appliedTheme === 'dark'
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : 'bg-blue-100 text-blue-700')
              }`}>
                {theme === 'system' ? '跟随系统' : (appliedTheme === 'dark' ? '深色模式' : '浅色模式')}
                {theme === 'system' && ` (${appliedTheme === 'dark' ? '当前深色' : '当前浅色'})`}
              </span>
            </div>
          </div>

          {/* 主题选择 */}
          <div>
            <label className={`block text-sm font-medium mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              选择主题
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const isSelected = theme === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      isSelected
                        ? `${option.selectedBg} border-transparent shadow-lg shadow-${option.selectedBg.split('-')[1]}-500/30`
                        : `${option.unselectedBg} ${option.unselectedBorder} ${option.unselectedText} hover:border-opacity-70`
                    } ${isDark && !isSelected && option.value !== 'system' ? 'bg-slate-800 border-slate-600 text-slate-200' : ''}`}
                  >
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className={`font-semibold ${isSelected ? 'text-white' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                          {option.label}
                        </div>
                        <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 提示信息 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-blue-900/30 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <h3 className="font-medium mb-2">💡 主题说明</h3>
            <ul className="space-y-1 text-sm">
              <li>• <strong>浅色模式</strong>：适合光线充足的环境，提供清晰的阅读体验</li>
              <li>• <strong>深色模式</strong>：适合低光环境，减少眼睛疲劳</li>
              <li>• <strong>跟随系统</strong>：自动根据操作系统设置切换主题</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 题目类型设置 */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">📚 题目类型设置</h1>
          <p className="text-blue-100 text-sm mt-1">选择你想要练习的题目类型和难度</p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 当前设置显示 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>当前设置</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
              }`}>
                知识点: {selectedTopic || '全部'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}>
                难度: {selectedDifficulty === 'easy' ? '简单' : selectedDifficulty === 'medium' ? '中等' : selectedDifficulty === 'hard' ? '困难' : '全部'}
              </span>
            </div>
          </div>

          {/* Topic 筛选 */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>知识点类型</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTopicChange(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedTopic === null
                    ? 'bg-blue-500 text-white border-blue-600'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              {categories.topics.map((topic) => (
                <button
                  key={topic.topic}
                  onClick={() => handleTopicChange(topic.topic)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedTopic === topic.topic
                      ? 'bg-blue-500 text-white border-blue-600'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {topic.topic} ({topic.count})
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty 筛选 */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>难度级别</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDifficultyChange(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedDifficulty === null
                    ? 'bg-slate-800 text-white border-slate-900'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              {categories.difficulties.map((diff) => (
                <button
                  key={diff.name}
                  onClick={() => handleDifficultyChange(diff.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedDifficulty === diff.name
                      ? difficultyColorsSelected[diff.name]
                      : difficultyColors[diff.name]
                  }`}
                >
                  {diff.label} ({diff.count})
                </button>
              ))}
            </div>
          </div>

          {/* 清除筛选 */}
          {(selectedTopic || selectedDifficulty) && (
            <button
              onClick={handleClearFilter}
              className={`text-sm underline transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              清除筛选
            </button>
          )}

          {/* 提示信息 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <h3 className="font-medium mb-2">⚠️ 切换提示</h3>
            <p className="text-sm">
              切换题目类型需要验证，请输入"我真的已经学会当前题型了"才能切换。
              这是为了帮助你保持专注，避免频繁切换题目类型。
            </p>
          </div>

          {/* AI 生成新题按钮 */}
          <div className={`pt-4 border-t transition-colors duration-300 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <button
              onClick={openAIGenerateDialog}
              disabled={aiGenerateLoading}
              className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                aiGenerateLoading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg'
              }`}
            >
              <span>✨</span>
              <span>{aiGenerateLoading ? 'AI 出题中...' : 'AI 生成新题'}</span>
            </button>
            <p className={`text-xs text-center mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              使用 AI 根据当前设置生成新题目
            </p>
          </div>
        </div>
      </div>

      {/* API Key 设置 */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">⚙️ AI 解析设置</h1>
          <p className="text-purple-100 text-sm mt-1">配置 AI 解析服务</p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* API Key 配置 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              DashScope API Key
            </label>
            <div className="space-y-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                >
                  保存配置
                </button>
                {apiKey && (
                  <>
                    <button
                      onClick={handleTest}
                      disabled={testing}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        testing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {testing ? '测试中...' : '🔌 连接测试'}
                    </button>
                    <button
                      onClick={handleClear}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        isDark
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      清除配置
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 状态提示 */}
            {saved && (
              <div className={`mt-3 p-3 border rounded-xl ${
                isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
              }`}>
                <p className={`text-sm flex items-center ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  <span className="mr-2">✅</span>
                  API Key 已保存到本地浏览器
                </p>
              </div>
            )}

            {error && (
              <div className={`mt-3 p-3 border rounded-xl ${
                isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm flex items-center ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  <span className="mr-2">❌</span>
                  {error}
                </p>
              </div>
            )}

            {/* 连接测试日志 */}
            {testLog && (
              <div className={`mt-4 p-4 rounded-xl border font-mono text-sm whitespace-pre-wrap ${
                testLog.includes('✅')
                  ? (isDark ? 'bg-green-900/30 border-green-600 text-green-200' : 'bg-green-50 border-green-300 text-green-800')
                  : (isDark ? 'bg-red-900/30 border-red-600 text-red-200' : 'bg-red-50 border-red-300 text-red-800')
              }`}>
                <p className="font-semibold mb-2">📋 测试日志：</p>
                {testLog}
              </div>
            )}
          </div>

          {/* 获取 API Key 指引 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>📖 如何获取 API Key？</h3>
            <ol className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <li>1. 访问 <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">阿里云 DashScope 控制台</a></li>
              <li>2. 登录/注册阿里云账号</li>
              <li>3. 开通"模型服务"（通义千问）</li>
              <li>4. 在"API-KEY 管理"页面创建新的 API Key</li>
              <li>5. 复制 API Key 并粘贴到上方输入框</li>
            </ol>
          </div>

          {/* 安全提示 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <h3 className="font-medium mb-2">🔒 安全提示</h3>
            <ul className="space-y-1 text-sm">
              <li>• 你的 API Key 只存储在本地浏览器，不会上传到服务器</li>
              <li>• 每次调用 AI 解析时，API Key 会直接发送给阿里云 DashScope 服务</li>
              <li>• 请妥善保管你的 API Key，不要分享给他人</li>
              <li>• 如果 API Key 泄露，请及时在阿里云控制台重新生成</li>
            </ul>
          </div>

          {/* 使用说明 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-blue-900/30 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <h3 className="font-medium mb-2">💡 使用说明</h3>
            <ul className="space-y-1 text-sm">
              <li>• 配置 API Key 后，在刷题页面可以使用"AI 详细解析"功能</li>
              <li>• AI 解析使用阿里云通义千问（Qwen3.5-Plus）模型</li>
              <li>• 每次解析约消耗少量 token，费用低廉</li>
              <li>• 如果解析失败，请检查 API Key 是否有效或余额是否充足</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* 头部 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">🗑️ 数据管理</h1>
          <p className="text-orange-100 text-sm mt-1">管理做题记录和学习进度</p>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 当前记录统计 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>当前记录</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 text-center ${
                isDark ? 'bg-slate-700' : 'bg-white'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>已记录分类数</div>
                <div className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {Object.keys(answeredQuestionsByCategory).length}
                </div>
              </div>
              <div className={`rounded-lg p-3 text-center ${
                isDark ? 'bg-slate-700' : 'bg-white'
              }`}>
                <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>当前分类已做题数</div>
                <div className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {(answeredQuestionsByCategory[`${selectedTopic || 'all'}_${selectedDifficulty || 'all'}`] || []).length}
                </div>
              </div>
            </div>
          </div>

          {/* 清理按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => openClearVerifyDialog('current')}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-600/30'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              🗑️ 清理当前分类记录
            </button>
            <button
              onClick={() => openClearVerifyDialog('all')}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              }`}
            >
              🗑️ 清理所有记录
            </button>
          </div>

          {/* 提示信息 */}
          <div className={`rounded-xl p-4 border transition-colors duration-300 ${
            isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <h3 className="font-medium mb-2">⚠️ 清理提示</h3>
            <p className="text-sm">
              清理做题记录需要验证，请输入"我确定要重新学习一遍"才能清理。
              清理后该分类的做题记录将被重置，您可以重新开始做题。
            </p>
          </div>
        </div>
      </div>

      {/* 验证对话框 */}
      {showVerifyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 transition-colors duration-300 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>⚠️ 确认切换</h3>
              <button
                onClick={() => setShowVerifyDialog(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="text-sm">
                  为了提高专注力，切换题目类型需要验证。
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  请输入以下文字以确认切换：
                </label>
                <div className={`rounded-lg p-3 mb-2 ${
                  isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  <code className="font-medium">我真的已经学会当前题型了</code>
                </div>
                <input
                  type="text"
                  value={verifyText}
                  onChange={(e) => setVerifyText(e.target.value)}
                  placeholder="请输入上方文字"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                {verifyError && (
                  <p className="text-red-400 text-sm mt-2">{verifyError}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowVerifyDialog(false)}
                className={`flex-1 px-4 py-3 border rounded-xl transition-colors font-medium ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleVerifyAndSwitch}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-colors font-medium"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 生成题目对话框 */}
      {showAIGenerateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 transition-colors duration-300 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>✨ AI 生成新题</h3>
              <button
                onClick={() => setShowAIGenerateDialog(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 题目类型 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>题目类型</label>
                <select
                  value={aiGenerateParams.topic}
                  onChange={(e) => setAiGenerateParams({ ...aiGenerateParams, topic: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="">随机类型</option>
                  {categories.topics.map((topic) => (
                    <option key={topic.topic} value={topic.topic}>{topic.topic}</option>
                  ))}
                </select>
              </div>

              {/* 难度 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>难度</label>
                <div className="flex space-x-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setAiGenerateParams({ ...aiGenerateParams, difficulty: diff })}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        aiGenerateParams.difficulty === diff
                          ? 'bg-purple-600 text-white border-purple-600'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-purple-400'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 数量 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>生成数量</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setAiGenerateParams({ ...aiGenerateParams, count: Math.max(1, aiGenerateParams.count - 1) })}
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                      isDark
                        ? 'border-slate-600 hover:bg-slate-700'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={aiGenerateParams.count}
                    onChange={(e) => setAiGenerateParams({ ...aiGenerateParams, count: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className={`w-20 text-center px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                  <button
                    onClick={() => setAiGenerateParams({ ...aiGenerateParams, count: Math.min(10, aiGenerateParams.count + 1) })}
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                      isDark
                        ? 'border-slate-600 hover:bg-slate-700'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>最多可生成 10 道题目</p>
              </div>

              {/* 生成结果 */}
              {aiGenerateResult && (
                <div className={`p-4 rounded-xl border ${
                  aiGenerateResult.success
                    ? (isDark ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700')
                    : (isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700')
                }`}>
                  <p className="text-sm">
                    {aiGenerateResult.success ? '✅' : '❌'} {aiGenerateResult.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAIGenerateDialog(false)}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={aiGenerateLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
              >
                {aiGenerateLoading ? '生成中...' : '开始生成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清理记录验证对话框 */}
      {showClearVerifyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 transition-colors duration-300 ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {clearType === 'current' ? '🗑️ 清理当前分类记录' : '🗑️ 清理所有记录'}
              </h3>
              <button
                onClick={() => setShowClearVerifyDialog(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}
              >
                <svg className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p className="text-sm">
                  {clearType === 'current' 
                    ? `您即将清理当前分类（${selectedTopic || '全部'} / ${selectedDifficulty || '全部难度'}）的做题记录。此操作不可恢复！`
                    : '您即将清理所有分类的做题记录。此操作不可恢复！'
                  }
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  请输入以下文字以确认清理：
                </label>
                <div className={`rounded-lg p-3 mb-2 ${
                  isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  <code className="font-medium">我确定要重新学习一遍</code>
                </div>
                <input
                  type="text"
                  value={clearVerifyText}
                  onChange={(e) => setClearVerifyText(e.target.value)}
                  placeholder="请输入上方文字"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                {clearVerifyError && (
                  <p className="text-red-400 text-sm mt-2">{clearVerifyError}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowClearVerifyDialog(false)}
                className={`flex-1 px-4 py-3 border rounded-xl transition-colors font-medium ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleVerifyAndClear}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-colors font-medium"
              >
                确认清理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
