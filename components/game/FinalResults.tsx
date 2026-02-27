'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, MessageSquare, FileText, Lightbulb, Wrench, Crown, Medal, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoundData } from '@/lib/game-types'
import { getGrade, getGradeColor } from '@/lib/game-types'

interface FinalResultsProps {
  roundData: RoundData
  sessionId: string | null
  onRestart: () => void
}

interface RankingEntry {
  rank: number
  score: number
  grade: string
  isMe: boolean
  prompt_text?: string | null
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return 'from-emerald-500 to-emerald-400'
    if (s >= 60) return 'from-violet-500 to-fuchsia-500'
    if (s >= 40) return 'from-amber-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-violet-200">{label}</span>
        <span className="text-sm font-semibold text-white">{score}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full bg-gradient-to-r ${getBarColor(score)} rounded-full`}
        />
      </div>
    </div>
  )
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return null
}

function getRankBg(rank: number, isMe: boolean) {
  if (isMe) return 'bg-violet-500/20 border-violet-500/40'
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20'
  if (rank === 2) return 'bg-slate-400/10 border-slate-400/20'
  if (rank === 3) return 'bg-amber-600/10 border-amber-600/20'
  return 'bg-white/[0.03] border-white/10'
}

export function FinalResults({ roundData, sessionId, onRestart }: FinalResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [showRanking, setShowRanking] = useState(false)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [rankingFetched, setRankingFetched] = useState(false)
  const [rankingError, setRankingError] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<{ rank: number; text: string } | null>(null)
  const [downloading, setDownloading] = useState(false)

  const finalScore = roundData.totalScore
  const grade = getGrade(finalScore)
  const gradeColors = getGradeColor(grade)

  // Animate score
  useEffect(() => {
    let current = 0
    const increment = finalScore / 50
    const timer = setInterval(() => {
      current += increment
      if (current >= finalScore) {
        setAnimatedScore(finalScore)
        clearInterval(timer)
        setTimeout(() => setShowDetails(true), 400)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, 20)
    return () => clearInterval(timer)
  }, [finalScore])

  // Confetti
  useEffect(() => {
    const launchConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#d946ef', '#f59e0b', '#10b981'],
        })
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#8b5cf6', '#d946ef'],
          })
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#8b5cf6', '#d946ef'],
          })
        }, 500)
      } catch {
        // canvas-confetti may fail silently
      }
    }
    launchConfetti()
  }, [])

  // Fetch ranking
  const fetchRanking = useCallback(async () => {
    if (rankingLoading) return
    setRankingLoading(true)
    setRankingError(null)
    try {
      const params = new URLSearchParams()
      if (sessionId) params.set('session_id', sessionId)
      const url = `/api/game/ranking?${params.toString()}`
      const res = await fetch(url)
      const json = await res.json()
      if (res.ok) {
        setRankings(json.rankings || [])
        setMyRank(json.my_rank ?? null)
        setTotalPlayers(json.total_players || 0)
        setRankingFetched(true)
      } else {
        setRankingError(json.error || `API 에러 (status: ${res.status})`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRankingError(`네트워크 에러: ${msg}`)
    } finally {
      setRankingLoading(false)
    }
  }, [sessionId, rankingLoading])

  // Auto-fetch ranking on mount
  useEffect(() => {
    if (!rankingFetched) {
      fetchRanking()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleRanking = () => {
    if (!showRanking && rankings.length === 0 && !rankingFetched) {
      fetchRanking()
    }
    setShowRanking(!showRanking)
  }

  // Generate share image on canvas
  const generateShareImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')!

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920)
      bgGrad.addColorStop(0, '#1e1033')
      bgGrad.addColorStop(0.5, '#2d1b69')
      bgGrad.addColorStop(1, '#1a0d2e')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1080, 1920)

      // Decorative circles
      ctx.globalAlpha = 0.08
      ctx.beginPath()
      ctx.arc(200, 400, 300, 0, Math.PI * 2)
      ctx.fillStyle = '#8b5cf6'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(880, 1400, 250, 0, Math.PI * 2)
      ctx.fillStyle = '#d946ef'
      ctx.fill()
      ctx.globalAlpha = 1

      // Title
      ctx.textAlign = 'center'
      ctx.fillStyle = '#a78bfa'
      ctx.font = 'bold 48px sans-serif'
      ctx.fillText('PROMPT BATTLE', 540, 440)

      // Score circle
      const scoreGrad = ctx.createLinearGradient(390, 550, 690, 950)
      scoreGrad.addColorStop(0, '#8b5cf6')
      scoreGrad.addColorStop(1, '#d946ef')
      ctx.beginPath()
      ctx.arc(540, 750, 180, 0, Math.PI * 2)
      ctx.strokeStyle = scoreGrad
      ctx.lineWidth = 12
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 120px sans-serif'
      ctx.fillText(`${finalScore}`, 540, 785)
      ctx.font = 'bold 32px sans-serif'
      ctx.fillStyle = '#c4b5fd'
      ctx.fillText('SCORE', 540, 835)

      // Grade
      ctx.font = 'bold 64px sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(grade, 540, 1020)

      // Ranking section
      if (myRank && totalPlayers > 0) {
        // Rank badge background
        const rankBoxY = 1080
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)'
        ctx.beginPath()
        ctx.roundRect(290, rankBoxY, 500, 120, 24)
        ctx.fill()
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(290, rankBoxY, 500, 120, 24)
        ctx.stroke()

        // Trophy icon (text fallback)
        ctx.font = '40px sans-serif'
        ctx.fillText('\uD83C\uDFC6', 370, rankBoxY + 72)

        // Rank text
        ctx.textAlign = 'center'
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = '#fde68a'
        ctx.fillText('나의 순위', 540, rankBoxY + 45)
        ctx.font = 'bold 48px sans-serif'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(`${myRank}위`, 490, rankBoxY + 95)
        ctx.font = '28px sans-serif'
        ctx.fillStyle = '#fde68a80'
        ctx.fillText(`/ ${totalPlayers}명`, 600, rankBoxY + 95)
      }

      // Score breakdown
      const breakdownY = myRank ? 1280 : 1180
      ctx.textAlign = 'center'

      // Idea score box
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)'
      ctx.beginPath()
      ctx.roundRect(120, breakdownY, 400, 100, 20)
      ctx.fill()
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#c4b5fd'
      ctx.fillText('아이디어', 320, breakdownY + 40)
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${roundData.ideaScore}점`, 320, breakdownY + 80)

      // Prompt score box
      ctx.fillStyle = 'rgba(217, 70, 239, 0.15)'
      ctx.beginPath()
      ctx.roundRect(560, breakdownY, 400, 100, 20)
      ctx.fill()
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#e9b5f6'
      ctx.fillText('프롬프트', 760, breakdownY + 40)
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${roundData.promptScore}점`, 760, breakdownY + 80)

      // Top 3 ranking preview (if available)
      if (rankings.length > 0) {
        const topY = breakdownY + 150
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.beginPath()
        ctx.roundRect(140, topY, 800, Math.min(rankings.length, 5) * 60 + 50, 20)
        ctx.fill()

        ctx.font = 'bold 24px sans-serif'
        ctx.fillStyle = '#a78bfa'
        ctx.fillText('RANKING', 540, topY + 35)

        const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49']
        const top = rankings.slice(0, 5)
        top.forEach((entry, i) => {
          const rowY = topY + 65 + i * 55
          const rowBg = entry.isMe ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)'
          ctx.fillStyle = rowBg
          ctx.beginPath()
          ctx.roundRect(180, rowY - 18, 720, 48, 12)
          ctx.fill()

          ctx.textAlign = 'left'
          ctx.font = '24px sans-serif'
          ctx.fillStyle = '#ffffff'
          const prefix = i < 3 ? medals[i] : `${entry.rank}.`
          ctx.fillText(prefix, 200, rowY + 10)

          const name = entry.isMe ? 'ME' : `\uCC38\uAC00\uC790 ${entry.rank}`
          ctx.font = entry.isMe ? 'bold 24px sans-serif' : '24px sans-serif'
          ctx.fillStyle = entry.isMe ? '#c4b5fd' : '#e2d9f3'
          ctx.fillText(name, 270, rowY + 10)

          ctx.textAlign = 'right'
          ctx.font = 'bold 24px sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(`${entry.score}점`, 860, rowY + 10)
          ctx.textAlign = 'center'
        })
      }

      // Footer
      ctx.textAlign = 'center'
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#7c6faa'
      ctx.fillText('프롬프트는 감각이 아니라 설계다', 540, 1770)
      ctx.font = '24px sans-serif'
      ctx.fillText('AI가 판단한다.', 540, 1810)

      canvas.toBlob((blob) => resolve(blob!), 'image/png')
    })
  }, [finalScore, grade, roundData.ideaScore, roundData.promptScore, myRank, totalPlayers, rankings])

  // Download share image
  const handleDownloadImage = useCallback(async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await generateShareImage()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompt-battle-${finalScore}점-${grade}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setShareMessage('이미지가 저장되었습니다!')
      setTimeout(() => setShareMessage(''), 2000)
    } catch {
      setShareMessage('이미지 생성에 실패했습니다.')
      setTimeout(() => setShareMessage(''), 2000)
    } finally {
      setDownloading(false)
    }
  }, [downloading, generateShareImage, finalScore, grade])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
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
          <h2 className="text-3xl font-bold text-white mb-2">최종 결과</h2>
          <p className="text-violet-200/60">AI가 당신의 프롬프트를 분석했습니다</p>
        </div>

        {/* Final Score */}
        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-6 text-center">
          <p className="text-sm text-violet-300/70 mb-3">최종 점수</p>
          <div className="flex items-center justify-center gap-4 mb-5">
            <span className="text-8xl font-bold text-white tabular-nums">
              {animatedScore}
            </span>
            <div className={`px-5 py-3 ${gradeColors.bg} ${gradeColors.border} border rounded-2xl`}>
              <span className={`text-4xl font-bold ${gradeColors.text}`}>
                {grade}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${animatedScore}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            />
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xs text-violet-300/50 mb-1">아이디어</p>
              <p className="text-2xl font-bold text-white">{roundData.ideaScore}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-violet-300/50 mb-1">프롬프트</p>
              <p className="text-2xl font-bold text-white">{roundData.promptScore}</p>
            </div>
          </div>

          {/* My Rank Badge */}
          {myRank && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-5 inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-amber-200/70">나의 순위</span>
                <span className="text-2xl font-bold text-amber-400 mx-1">{myRank}</span>
                <span className="text-sm text-amber-200/70">위</span>
                <span className="text-xs text-amber-200/40 ml-1">/ {totalPlayers}명</span>
              </div>
            </motion.div>
          )}
        </div>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Idea Score Details */}
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">아이디어 평가</span>
                <span className="ml-auto text-lg font-bold text-white">{roundData.ideaScore}점</span>
              </div>
              <ScoreBar label="창의성" score={roundData.ideaDetails.creativity} />
              <ScoreBar label="실현 가능성" score={roundData.ideaDetails.feasibility} />
              <ScoreBar label="구체성" score={roundData.ideaDetails.specificity} />
              <ScoreBar label="시장성" score={roundData.ideaDetails.marketability} />
              <ScoreBar label="트렌드 적합도" score={roundData.ideaDetails.trendAlignment} />
            </div>

            {/* Prompt Score Details */}
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-5 h-5 text-sky-400" />
                <span className="font-semibold text-white">프롬프트 구조 평가</span>
                <span className="ml-auto text-lg font-bold text-white">{roundData.promptScore}점</span>
              </div>
              <ScoreBar label="역할 명확성" score={roundData.promptDetails.roleClarity} />
              <ScoreBar label="구조 품질" score={roundData.promptDetails.structureQuality} />
              <ScoreBar label="출력 명세" score={roundData.promptDetails.outputSpecification} />
            </div>

            {/* AI Feedback */}
            <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <span className="font-semibold text-white">AI 총평</span>
              </div>
              <p className="text-violet-100/80 leading-relaxed text-sm">
                {roundData.feedback}
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundData.strengths.length > 0 && (
                <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-white">강점</span>
                  </div>
                  <ul className="space-y-2">
                    {roundData.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-emerald-100/80">
                        <span className="text-emerald-400 mt-0.5 shrink-0">*</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {roundData.weaknesses.length > 0 && (
                <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-white">개선점</span>
                  </div>
                  <ul className="space-y-2">
                    {roundData.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-100/80">
                        <span className="text-amber-400 mt-0.5 shrink-0">*</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Written Prompt */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-violet-400" />
                <span className="font-semibold text-white">작성한 프롬프트</span>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-violet-100/70 whitespace-pre-wrap break-words">
                  {roundData.prompt}
                </p>
              </div>
            </div>

            {/* Ranking Section */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={handleToggleRanking}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-white">랭킹 조회</span>
                  {myRank && (
                    <span className="ml-2 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs text-violet-300">
                      내 순위: {myRank}위 / {totalPlayers}명
                    </span>
                  )}
                </div>
                {showRanking ? (
                  <ChevronUp className="w-5 h-5 text-violet-300/50" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-violet-300/50" />
                )}
              </button>
              <AnimatePresence>
                {showRanking && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5">
                      {rankingLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                          <span className="ml-3 text-sm text-violet-300/60">랭킹 불러오는 중...</span>
                        </div>
                      ) : rankingError ? (
                        <div className="text-center py-8">
                          <p className="text-red-400 text-sm mb-3">{rankingError}</p>
                          <button
                            onClick={() => fetchRanking()}
                            className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-sm text-violet-200 hover:bg-violet-500/30 transition-colors"
                          >
                            다시 시도
                          </button>
                        </div>
                      ) : rankings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-violet-300/50 text-sm mb-3">아직 랭킹 데이터가 없습니다.</p>
                          <button
                            onClick={() => fetchRanking()}
                            className="px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-sm text-violet-200 hover:bg-violet-500/30 transition-colors"
                          >
                            다시 불러오기
                          </button>
                        </div>
                      ) : (
                        <>
                          {myRank && (
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4 text-center">
                              <p className="text-sm text-violet-300/70 mb-1">나의 순위</p>
                              <p className="text-3xl font-bold text-white">
                                {myRank}<span className="text-lg text-violet-300/60">위</span>
                              </p>
                              <p className="text-xs text-violet-300/50 mt-1">
                                전체 {totalPlayers}명 중
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            {rankings.map((entry, idx) => {
                              const hasPrompt = entry.rank <= 3 && entry.prompt_text
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (hasPrompt) {
                                      setSelectedPrompt({ rank: entry.rank, text: entry.prompt_text! })
                                    }
                                  }}
                                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${getRankBg(entry.rank, entry.isMe)} ${hasPrompt ? 'cursor-pointer hover:bg-white/[0.08]' : ''}`}
                                >
                                  <div className="w-8 text-center shrink-0">
                                    {getRankIcon(entry.rank) || (
                                      <span className="text-sm font-semibold text-violet-300/60">
                                        {entry.rank}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">
                                        {entry.isMe ? '나' : `참가자 ${entry.rank}`}
                                      </span>
                                      {entry.isMe && (
                                        <span className="px-1.5 py-0.5 bg-violet-500/30 border border-violet-500/40 rounded text-[10px] text-violet-200 font-medium">
                                          ME
                                        </span>
                                      )}
                                      {hasPrompt && (
                                        <span className="px-1.5 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded text-[10px] text-sky-300 font-medium">
                                          프롬프트 보기
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${getGradeColor(getGrade(entry.score)).bg} ${getGradeColor(getGrade(entry.score)).text} ${getGradeColor(getGrade(entry.score)).border} border`}>
                                        {entry.grade}
                                      </span>
                                      <span className="text-sm font-bold text-white tabular-nums">
                                        {entry.score}점
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Prompt Modal */}
                          <AnimatePresence>
                            {selectedPrompt && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mt-4 bg-sky-500/[0.08] border border-sky-500/20 rounded-xl p-5"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-sky-400" />
                                    <span className="text-sm font-semibold text-white">{selectedPrompt.rank}위의 프롬프트</span>
                                  </div>
                                  <button
                                    onClick={() => setSelectedPrompt(null)}
                                    className="text-xs text-violet-300/50 hover:text-violet-200 transition-colors"
                                  >
                                    닫기
                                  </button>
                                </div>
                                <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                                  <p className="text-sm text-violet-100/80 whitespace-pre-wrap break-words leading-relaxed">
                                    {selectedPrompt.text}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadImage}
                disabled={downloading}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>이미지 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>공유용 이미지 저장하기</span>
                  </>
                )}
              </motion.button>

              {shareMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-emerald-400"
                >
                  {shareMessage}
                </motion.p>
              )}

              <a
                href="https://forms.gle/Wcu1rHhVazCjmu8N9"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {'재밌었다면 dwnc go!go!'}
              </a>

              <button
                onClick={onRestart}
                className="w-full py-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-violet-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>다시 도전하기</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
