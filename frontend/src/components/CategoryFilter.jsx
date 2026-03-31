import { useState, useEffect } from 'react'

function CategoryFilter({ selectedTopic, selectedDifficulty, onTopicChange, onDifficultyChange }) {
  const [categories, setCategories] = useState({
    topics: [],
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200">
        <div className="animate-pulse h-6 bg-slate-200 rounded w-32"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Topic 筛选 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600">知识点：</span>
          <button
            onClick={() => onTopicChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              selectedTopic === null
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {categories.topics.map((topic) => (
            <button
              key={topic.topic}
              onClick={() => onTopicChange(topic.topic)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                selectedTopic === topic.topic
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {topic.topic} ({topic.count})
            </button>
          ))}
        </div>

        {/* Difficulty 筛选 */}
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
