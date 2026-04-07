import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function CategoryFilter({ selectedTopic, selectedDifficulty, onTopicChange, onDifficultyChange }) {
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  const [categories, setCategories] = useState({
    topics: [],
    groupedTopics: {},
    difficulties: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [selectedTopic])

  const fetchCategories = async () => {
    try {
      // 根据选中的 topic 获取对应的难度统计
      const url = selectedTopic 
        ? `http://localhost:3001/api/questions/categories?topic=${encodeURIComponent(selectedTopic)}`
        : 'http://localhost:3001/api/questions/categories'
      console.log('[CategoryFilter] 请求URL:', url, 'selectedTopic:', selectedTopic)
      const response = await fetch(url)
      const result = await response.json()
      console.log('[CategoryFilter] 返回结果:', result)
      if (result.success) {
        setCategories(prev => ({
          topics: result.data.topics, // topics 始终返回全部
          groupedTopics: result.data.groupedTopics || {}, // 分组数据
          difficulties: result.data.difficulties // difficulties 根据 topic 筛选
        }))
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    hard: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
  }

  const difficultyColorsSelected = {
    easy: 'bg-green-500 text-white border-green-600',
    medium: 'bg-yellow-500 text-white border-yellow-600',
    hard: 'bg-red-500 text-white border-red-600'
  }

  // 分组颜色配置 - 支持暗黑模式
  const groupColors = {
    '计算机类': {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      border: isDark ? 'border-blue-700' : 'border-blue-200',
      title: isDark ? 'text-blue-300' : 'text-blue-700',
      button: isDark 
        ? 'bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-900/50' 
        : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
      buttonSelected: 'bg-blue-500 text-white border-blue-600'
    },
    '小学类': {
      bg: isDark ? 'bg-green-900/20' : 'bg-green-50',
      border: isDark ? 'border-green-700' : 'border-green-200',
      title: isDark ? 'text-green-300' : 'text-green-700',
      button: isDark 
        ? 'bg-green-900/30 text-green-300 border-green-700 hover:bg-green-900/50' 
        : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
      buttonSelected: 'bg-green-500 text-white border-green-600'
    },
    '初中类': {
      bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      border: isDark ? 'border-orange-700' : 'border-orange-200',
      title: isDark ? 'text-orange-300' : 'text-orange-700',
      button: isDark 
        ? 'bg-orange-900/30 text-orange-300 border-orange-700 hover:bg-orange-900/50' 
        : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
      buttonSelected: 'bg-orange-500 text-white border-orange-600'
    },
    '高中类': {
      bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      border: isDark ? 'border-purple-700' : 'border-purple-200',
      title: isDark ? 'text-purple-300' : 'text-purple-700',
      button: isDark 
        ? 'bg-purple-900/30 text-purple-300 border-purple-700 hover:bg-purple-900/50' 
        : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
      buttonSelected: 'bg-purple-500 text-white border-purple-600'
    },
    '其他': {
      bg: isDark ? 'bg-slate-800' : 'bg-gray-50',
      border: isDark ? 'border-slate-600' : 'border-gray-200',
      title: isDark ? 'text-slate-300' : 'text-gray-700',
      button: isDark 
        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
      buttonSelected: 'bg-slate-500 text-white border-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-slate-500 dark:text-slate-400 text-sm">加载分类中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl shadow-md p-4 border mb-6 transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      {/* Topic 筛选 - 按大类分组显示 */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>知识点类型：</span>
          <button
            onClick={() => onTopicChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedTopic === null
                ? (isDark 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-slate-800 text-white border-slate-900')
                : (isDark 
                    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
            }`}
          >
            全部
          </button>
        </div>
        
        {/* 分组显示 */}
        <div className="space-y-3">
          {Object.entries(categories.groupedTopics).map(([groupName, topics]) => (
            topics.length > 0 && (
              <div 
                key={groupName} 
                className={`p-3 rounded-lg border ${groupColors[groupName]?.bg || 'bg-gray-50'} ${groupColors[groupName]?.border || 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-sm font-bold whitespace-nowrap mt-1 ${groupColors[groupName]?.title || 'text-gray-700'}`}>
                    {groupName}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <button
                        key={topic.topic}
                        onClick={() => onTopicChange(topic.topic)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          selectedTopic === topic.topic
                            ? (groupColors[groupName]?.buttonSelected || 'bg-slate-800 text-white border-slate-900')
                            : (groupColors[groupName]?.button || 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
                        }`}
                      >
                        {topic.topic} ({topic.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Difficulty 筛选 */}
      <div className={`flex flex-wrap items-center gap-4 pt-4 border-t ${
        isDark ? 'border-slate-600' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>难度：</span>
          <button
            onClick={() => onDifficultyChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedDifficulty === null
                ? (isDark 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-slate-800 text-white border-slate-900')
                : (isDark 
                    ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')
            }`}
          >
            全部
          </button>
          {categories.difficulties.map((diff) => (
            <button
              key={diff.name}
              onClick={() => onDifficultyChange(diff.name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                selectedDifficulty === diff.name
                  ? difficultyColorsSelected[diff.name]
                  : difficultyColors[diff.name]
              }`}
            >
              {diff.label} ({diff.count})
            </button>
          ))}
        </div>

        {/* 清除筛选 */}
        {(selectedTopic || selectedDifficulty) && (
          <button
            onClick={() => {
              onTopicChange(null)
              onDifficultyChange(null)
            }}
            className={`text-sm underline transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}

export default CategoryFilter
