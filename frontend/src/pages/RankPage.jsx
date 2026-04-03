import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getRanking, getMyRank } from '../api/quizApi'

function RankPage() {
  const { user } = useAuth()
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'
  const [ranking, setRanking] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
    loadMyRank()
  }, [])

  const loadRanking = async () => {
    try {
      const res = await getRanking()
      setRanking(res.data || [])
    } catch (error) {
      console.error('获取排行榜失败:', error)
    }
  }

  const loadMyRank = async () => {
    try {
      const res = await getMyRank()
      setMyRank(res.data)
    } catch (error) {
      console.error('获取我的排名失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
    if (rank === 2) return 'bg-gradient-to-r from-slate-400 to-slate-500'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700'
    return isDark ? 'bg-slate-700' : 'bg-slate-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          isDark ? 'text-slate-100' : 'text-slate-800'
        }`}>🏆 排行榜</h1>
        <p className={`transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>看看谁是最强的学习王者</p>
      </div>

      {/* 我的排名 */}
      {myRank && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">我的排名</p>
              <p className="text-3xl font-bold">
                {myRank.rank ? `第 ${myRank.rank} 名` : '暂无排名'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-white/60 text-xs">正确数</p>
                  <p className="text-xl font-bold">{myRank.correctCount}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">正确率</p>
                  <p className="text-xl font-bold">{myRank.accuracy}%</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">总题数</p>
                  <p className="text-xl font-bold">{myRank.totalCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 排行榜列表 */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-6 py-4 border-b transition-colors duration-300 ${
          isDark
            ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700'
            : 'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100'
        }`}>
          <h2 className={`font-bold transition-colors duration-300 ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}> TOP 50 </h2>
        </div>

        <div className={`divide-y transition-colors duration-300 ${
          isDark ? 'divide-slate-700' : 'divide-slate-100'
        }`}>
          {ranking.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-6xl mb-4 block">📊</span>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>暂无排行数据</p>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>快去刷题成为第一名吧！</p>
            </div>
          ) : (
            ranking.map((item, index) => (
              <div
                key={item.userId}
                className={`px-6 py-4 flex items-center transition-colors ${
                  item.userId === user?.id
                    ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50')
                    : (isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')
                }`}
              >
                {/* 排名 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mr-4 ${getRankBg(item.rank)}`}>
                  {getRankIcon(item.rank)}
                </div>

                {/* 用户信息 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium transition-colors duration-300 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>{item.username}</span>
                    {item.userId === user?.id && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>我</span>
                    )}
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>正确数</p>
                    <p className="font-bold text-green-500">{item.correctCount}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>正确率</p>
                    <p className="font-bold text-blue-500">{item.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>总题数</p>
                    <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.totalCount}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RankPage
