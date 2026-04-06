import { useState, useEffect } from 'react'

function CategoryFilter({ selectedTopic, selectedDifficulty, onTopicChange, onDifficultyChange }) {
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

  // 分组颜色配置
  const groupColors = {
    '计算机类': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-700',
      button: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
      buttonSelected: 'bg-blue-500 text-white border-blue-600'
    },
    '小学类': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-700',
      button: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
      buttonSelected: 'bg-green-500 text-white border-green-600'
    },
    '初中类': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      title: 'text-orange-700',
      button: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
      buttonSelected: 'bg-orange-500 text-white border-orange-600'
    },
    '高中类': {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      title: 'text-purple-700',
      button: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
      buttonSelected: 'bg-purple-500 text-white border-purple-600'
    },
    '其他': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      title: 'text-gray-700',
      button: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
      buttonSelected: 'bg-gray-500 text-white border-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200">
        <div className="animate-pulse h-6 bg-slate-200 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200 mb-6">
      {/* Topic 筛选 - 按大类分组显示 */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm font-medium text-slate-600">知识点类型：</span>
          <button
            onClick={() => onTopicChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedTopic === null
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
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
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">难度：</span>
          <button
            onClick={() => onDifficultyChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedDifficulty === null
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
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
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  )
}

export default CategoryFilter
