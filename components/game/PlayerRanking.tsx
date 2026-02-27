'use client'

import { useEffect, useState } from 'react'
import { Crown, Medal, TrendingUp, Users, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RankingData {
  myRank: number | null
  myScore: number | null
  totalPlayers: number
  percentile: number | null
  top10: {
    rank: number
    phone: string
    score: number
    isMe: boolean
  }[]
}

interface PlayerRankingProps {
  sessionId: string | null
  finalScore: number
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return null
}

function getPercentileMessage(percentile: number | null): string {
  if (percentile === null) return ''
  if (percentile <= 1) return '최상위권입니다!'
  if (percentile <= 5) return '상위 5% 안에 드셨습니다!'
  if (percentile <= 10) return '상위 10% 안에 드셨습니다!'
  if (percentile <= 25) return '상위 25% 안에 드셨습니다!'
  if (percentile <= 50) return '평균 이상의 실력입니다!'
  return '다음에는 더 높은 점수를 노려보세요!'
}

function getPercentileColor(percentile: number | null): string {
  if (percentile === null) return 'text-violet-300/60'
  if (percentile <= 5) return 'text-amber-400'
  if (percentile <= 10) return 'text-emerald-400'
  if (percentile <= 25) return 'text-sky-400'
  if (percentile <= 50) return 'text-violet-400'
  return 'text-violet-300/60'
}

export function PlayerRanking({ sessionId, finalScore }: PlayerRankingProps) {
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const params = new URLSearchParams()
        if (sessionId) params.set('session_id', sessionId)
        const res = await fetch(`/api/game/ranking?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setRanking(data)
        }
      } catch (e) {
        console.error('[v0] Failed to fetch ranking:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchRanking, 10000)
    return () => clearInterval(interval)
  }, [sessionId])

  if (loading) {
    return (
      <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          <span className="text-sm text-violet-300/60">랭킹 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!ranking) return null

  const { myRank, totalPlayers, percentile, top10 } = ranking

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* My Ranking Summary */}
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-white">나의 실시간 랭킹</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Users className="w-4 h-4 text-violet-300/50" />
            <span className="text-sm text-violet-300/50">
              {totalPlayers}명 참여
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Rank Display */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                  myRank && myRank <= 3
                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                    : myRank && myRank <= 10
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-white/[0.08] border border-white/10 text-white'
                }`}
              >
                {myRank ?? '-'}
              </div>
              {myRank && myRank <= 3 && (
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(myRank)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-violet-300/50 mb-0.5">현재 순위</p>
              <p className="text-white font-semibold">
                {myRank
                  ? `${totalPlayers}명 중 ${myRank}위`
                  : '순위 집계 중'}
              </p>
            </div>
          </div>

          {/* Percentile */}
          {percentile !== null && (
            <div className="text-right">
              <p className="text-sm text-violet-300/50 mb-0.5">상위</p>
              <p className={`text-2xl font-bold ${getPercentileColor(percentile)}`}>
                {percentile <= 1 ? '1' : percentile}%
              </p>
            </div>
          )}
        </div>

        {percentile !== null && (
          <p className={`text-sm mt-3 ${getPercentileColor(percentile)}`}>
            {getPercentileMessage(percentile)}
          </p>
        )}
      </div>

      {/* Leaderboard Toggle */}
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="w-full flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-white">Top 10 리더보드</span>
        </div>
        <motion.div
          animate={{ rotate: showLeaderboard ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className="w-5 h-5 text-violet-300/50" />
        </motion.div>
      </button>

      {/* Leaderboard */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
              {top10.length === 0 ? (
                <div className="p-6 text-center text-violet-300/50 text-sm">
                  아직 참여자가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {top10.map((entry, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-3 px-5 py-3.5 ${
                        entry.isMe
                          ? 'bg-violet-500/10 border-l-2 border-l-violet-500'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {entry.rank <= 3 ? (
                          getRankIcon(entry.rank)
                        ) : (
                          <span className="text-sm font-medium text-violet-300/60">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium truncate ${
                              entry.isMe ? 'text-violet-300' : 'text-white/80'
                            }`}
                          >
                            {entry.phone}
                          </span>
                          {entry.isMe && (
                            <span className="shrink-0 text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                              나
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="shrink-0">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            entry.rank === 1
                              ? 'text-amber-400'
                              : entry.rank <= 3
                                ? 'text-white'
                                : 'text-white/70'
                          }`}
                        >
                          {entry.score}점
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Show my rank if not in top 10 */}
              {myRank && myRank > 10 && (
                <>
                  <div className="px-5 py-2 flex items-center gap-2 text-violet-300/30">
                    <span className="text-xs">...</span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-violet-500/10 border-l-2 border-l-violet-500">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-violet-300">
                        {myRank}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-violet-300 truncate">
                          나의 점수
                        </span>
                        <span className="shrink-0 text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30">
                          나
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-sm font-bold text-violet-300 tabular-nums">
                        {finalScore}점
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
