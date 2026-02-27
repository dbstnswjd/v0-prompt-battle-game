'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trophy, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

function getGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'S':
      return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' }
    case 'A':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
    case 'B':
      return { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30' }
    case 'C':
      return { text: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30' }
    default:
      return { text: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
  }
}

interface ResultData {
  score: number
  rank: number | null
  totalPlayers: number
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.session_id as string

  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/game/result/${sessionId}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setResult(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    if (sessionId) fetchResult()
  }, [sessionId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          <p className="text-violet-300/60 text-sm">결과를 불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-violet-300/60 text-lg mb-6">결과를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl"
          >
            게임 시작하기
          </button>
        </div>
      </main>
    )
  }

  const grade = getGrade(result.score)
  const gradeColors = getGradeColor(grade)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-6 border border-amber-500/30"
          >
            <Trophy className="w-10 h-10 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            친구의 프롬프트 배틀 결과
          </h1>
          <p className="text-violet-300/60 text-sm">
            친구가 AI 프롬프트 배틀에서 도전했습니다!
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-6 text-center">
          <p className="text-sm text-violet-300/70 mb-3">최종 점수</p>
          <div className="flex items-center justify-center gap-4 mb-5">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.4 }}
              className="text-7xl font-bold text-white tabular-nums"
            >
              {result.score}
            </motion.span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.6 }}
              className={`px-4 py-2 ${gradeColors.bg} ${gradeColors.border} border rounded-2xl`}
            >
              <span className={`text-3xl font-bold ${gradeColors.text}`}>
                {grade}
              </span>
            </motion.div>
          </div>

          {/* Score Bar */}
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            />
          </div>

          {/* Rank */}
          {result.rank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-amber-200/70">순위</span>
                <span className="text-2xl font-bold text-amber-400 mx-1">{result.rank}</span>
                <span className="text-sm text-amber-200/70">위</span>
                <span className="text-xs text-amber-200/40 ml-1">/ {result.totalPlayers}명</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Challenge Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 mb-6 text-center"
        >
          <p className="text-violet-100/80 text-sm leading-relaxed">
            프롬프트는 감각이 아니라 설계다.
            <br />
            AI가 냉정하게 판단한다. 당신은 몇 점일까요?
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/')}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3 text-lg"
        >
          <Rocket className="w-6 h-6" />
          <span>나도 도전하기</span>
        </motion.button>
      </motion.div>
    </main>
  )
}
