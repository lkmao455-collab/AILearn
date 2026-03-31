import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getRanking, getMyRank } from '../api/quizApi'

function RankPage() {
  const { user } = useAuth()
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
    return 'bg-slate-100'
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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">🏆 排行榜</h1>
        <p className="text-slate-500">看看谁是最强的学习王者</p>
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
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h2 className="font-bold text-slate-800"> TOP 50 </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {ranking.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-slate-500">暂无排行数据</p>
              <p className="text-sm text-slate-400 mt-2">快去刷题成为第一名吧！</p>
            </div>
          ) : (
            ranking.map((item, index) => (
              <div
                key={item.userId}
                className={`px-6 py-4 flex items-center transition-colors ${
                  item.userId === user?.id ? 'bg-blue-50' : 'hover:bg-slate-50'
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
                    <span className="font-medium text-slate-800">{item.username}</span>
                    {item.userId === user?.id && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">我</span>
                    )}
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">正确数</p>
                    <p className="font-bold text-green-600">{item.correctCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">正确率</p>
                    <p className="font-bold text-blue-600">{item.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">总题数</p>
                    <p className="font-bold text-slate-700">{item.totalCount}</p>
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
