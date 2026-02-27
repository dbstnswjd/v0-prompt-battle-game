'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, MessageSquare, FileText, Lightbulb, Wrench, Crown, Medal, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoundData } from '@/lib/game-types'
import { getGrade, getGradeColor } from '@/lib/game-types'

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void
      isInitialized: () => boolean
      Link?: {
        sendDefault: (options: Record<string, unknown>) => void
      }
      Share?: {
        sendDefault: (options: Record<string, unknown>) => void
      }
    }
  }
}

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

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.726 1.8 5.117 4.51 6.473-.145.53-.935 3.42-.967 3.636 0 0-.02.166.088.23.108.063.234.03.234.03.31-.044 3.588-2.34 4.155-2.738.636.094 1.29.144 1.98.144 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
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
    try {
      const params = new URLSearchParams()
      if (sessionId) params.set('session_id', sessionId)
      const res = await fetch(`/api/game/ranking?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setRankings(json.rankings || [])
        setMyRank(json.my_rank || null)
        setTotalPlayers(json.total_players || 0)
        setRankingFetched(true)
      }
    } catch (e) {
      console.error('[v0] Failed to fetch ranking:', e)
    } finally {
      setRankingLoading(false)
    }
  }, [sessionId, rankingLoading])

  // Auto-fetch ranking on mount to show user's rank
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

  const rankText = myRank ? `\n현재 순위: ${myRank}위 / ${totalPlayers}명` : ''
  const shareText = `프롬프트 배틀에서 ${finalScore}점 (${grade}등급)을 받았습니다!${rankText}\n아이디어: ${roundData.ideaScore}점 | 프롬프트: ${roundData.promptScore}점\n\n프롬프트는 감각이 아니라 설계다. AI가 판단한다.`
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const kakaoInitialized = useRef(false)

  // Initialize Kakao SDK
  useEffect(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!kakaoKey) return

    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey)
        kakaoInitialized.current = true
      } else if (window.Kakao?.isInitialized()) {
        kakaoInitialized.current = true
      }
    }

    if (window.Kakao) {
      initKakao()
    } else {
      const check = setInterval(() => {
        if (window.Kakao) {
          initKakao()
          clearInterval(check)
        }
      }, 300)
      setTimeout(() => clearInterval(check), 10000)
    }
  }, [])

  const handleKakaoShare = useCallback(() => {
    // Try to init if not yet initialized
    if (window.Kakao && !window.Kakao.isInitialized()) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
      if (kakaoKey) {
        try { window.Kakao.init(kakaoKey) } catch { /* ignore */ }
      }
    }

    if (!window.Kakao?.isInitialized()) {
      setShareMessage('카카오 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      setTimeout(() => setShareMessage(''), 2000)
      return
    }

    const description = myRank
      ? `${finalScore}점 (${grade}등급) | 순위: ${myRank}위 / ${totalPlayers}명\n아이디어 ${roundData.ideaScore}점 | 프롬프트 ${roundData.promptScore}점`
      : `${finalScore}점 (${grade}등급)\n아이디어 ${roundData.ideaScore}점 | 프롬프트 ${roundData.promptScore}점`

    const sharePayload = {
      objectType: 'feed',
      content: {
        title: '프롬프트 배틀 결과',
        description,
        imageUrl: `${shareUrl}/og-image.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '나도 도전하기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    }

    // v1 SDK uses Kakao.Link, v2 SDK uses Kakao.Share
    if (window.Kakao.Link?.sendDefault) {
      window.Kakao.Link.sendDefault(sharePayload)
    } else if (window.Kakao.Share?.sendDefault) {
      window.Kakao.Share.sendDefault(sharePayload)
    } else {
      setShareMessage('카카오 공유 기능을 사용할 수 없습니다.')
      setTimeout(() => setShareMessage(''), 2000)
    }
  }, [finalScore, grade, myRank, totalPlayers, roundData.ideaScore, roundData.promptScore, shareUrl])

  const generateShareImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')!

      // Background gradient
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
      ctx.fillText('PROMPT BATTLE', 540, 500)

      // Score circle
      const scoreGrad = ctx.createLinearGradient(390, 650, 690, 1050)
      scoreGrad.addColorStop(0, '#8b5cf6')
      scoreGrad.addColorStop(1, '#d946ef')
      ctx.beginPath()
      ctx.arc(540, 850, 200, 0, Math.PI * 2)
      ctx.strokeStyle = scoreGrad
      ctx.lineWidth = 12
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 140px sans-serif'
      ctx.fillText(`${finalScore}`, 540, 890)
      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = '#c4b5fd'
      ctx.fillText('SCORE', 540, 945)

      // Grade
      ctx.font = 'bold 72px sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(grade, 540, 1130)

      // Rank (if available)
      if (myRank) {
        ctx.font = 'bold 42px sans-serif'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(`${myRank}위 / ${totalPlayers}명`, 540, 1220)
      }

      // Scores breakdown
      const detailY = myRank ? 1320 : 1280
      ctx.font = '36px sans-serif'
      ctx.fillStyle = '#e2d9f3'
      ctx.fillText(`아이디어  ${roundData.ideaScore}점  |  프롬프트  ${roundData.promptScore}점`, 540, detailY)

      // Footer
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#7c6faa'
      ctx.fillText('프롬프트는 감각이 아니라 설계다', 540, 1700)
      ctx.font = '24px sans-serif'
      ctx.fillText('AI가 판단한다.', 540, 1750)

      canvas.toBlob((blob) => resolve(blob!), 'image/png')
    })
  }, [finalScore, grade, roundData.ideaScore, roundData.promptScore, myRank, totalPlayers])

  const handleInstagramShare = useCallback(async () => {
    try {
      setShareMessage('스토리 이미지 생성 중...')
      const imageBlob = await generateShareImage()
      const file = new File([imageBlob], 'prompt-battle-result.png', { type: 'image/png' })

      // Step 1: Try Web Share API with file (mobile: opens share sheet -> user picks Instagram Stories)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        setShareMessage('')
        await navigator.share({
          files: [file],
          title: '프롬프트 배틀 결과',
        })
        return
      }

      // Step 2: Upload to Blob and open Instagram web (fallback)
      setShareMessage('인스타그램으로 이동 중...')

      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(imageBlob)
      })

      const uploadRes = await fetch('/api/game/share-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: dataUrl }),
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const { imageUrl } = await uploadRes.json()

      // Copy image URL to clipboard and open Instagram
      try {
        await navigator.clipboard.writeText(imageUrl)
      } catch {
        // ignore
      }

      // Open Instagram app or web
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile) {
        window.location.href = 'instagram://story-camera'
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank')
        }, 1500)
      } else {
        window.open('https://www.instagram.com/', '_blank')
      }

      setShareMessage('이미지 URL이 복사되었습니다! 인스타그램 스토리에 붙여넣기 하세요.')
      setTimeout(() => setShareMessage(''), 5000)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setShareMessage('')
        return
      }
      setShareMessage('공유에 실패했습니다. 다시 시도해주세요.')
      setTimeout(() => setShareMessage(''), 2000)
    }
  }, [generateShareImage])

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
                      ) : rankings.length === 0 ? (
                        <div className="text-center py-8 text-violet-300/50 text-sm">
                          아직 랭킹 데이터가 없습니다.
                        </div>
                      ) : (
                        <>
                          {/* My Rank Summary */}
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

                          {/* Ranking List */}
                          <div className="space-y-2">
                            {rankings.map((entry, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${getRankBg(entry.rank, entry.isMe)}`}
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
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleKakaoShare}
                  className="py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  <span>친구에게 공유</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstagramShare}
                  className="py-4 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <InstagramIcon className="w-5 h-5" />
                  <span>인스타 스토리</span>
                </motion.button>
              </div>

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
