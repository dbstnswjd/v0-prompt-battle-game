'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, MessageSquare, FileText, BarChart3, Lightbulb, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import type { RoundData } from '@/lib/game-types'
import { getGrade, getGradeColor } from '@/lib/game-types'

interface FinalResultsProps {
  round1: RoundData
  round2: RoundData | null
  onRestart: () => void
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

export function FinalResults({ round1, round2, onRestart }: FinalResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1)
  const [shareMessage, setShareMessage] = useState('')

  // Determine best round
  const bestRound = !round2
    ? round1
    : round1.totalScore >= round2.totalScore
      ? round1
      : round2

  const finalScore = bestRound.totalScore
  const grade = getGrade(finalScore)
  const gradeColors = getGradeColor(grade)
  const displayedRound = round2 && selectedRound === 2 ? round2 : round1

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

  // Confetti on mount
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

  const shareText = `프롬프트 배틀에서 ${finalScore}점 (${grade}등급)을 받았습니다!\n아이디어: ${bestRound.ideaScore}점 | 프롬프트: ${bestRound.promptScore}점\n\n프롬프트는 감각이 아니라 설계다. 단 2번의 기회, AI가 판단한다.`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleKakaoShare = useCallback(() => {
    // Kakao SDK share via URL scheme
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=javascript&url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    // Fallback: use Kakao Talk URL scheme for mobile or web share link
    const mobileKakaoUrl = `kakaotalk://msg/text/${encodeURIComponent(shareText)}`

    // Try mobile scheme first, fallback to web
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = mobileKakaoUrl
      setTimeout(() => {
        // If app didn't open, open web fallback
        window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank')
      }, 1500)
    } else {
      window.open(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank')
    }
  }, [shareText, shareUrl])

  const handleInstagramShare = useCallback(async () => {
    // Instagram doesn't support direct text sharing via URL
    // Copy text to clipboard and open Instagram
    try {
      await navigator.clipboard.writeText(shareText)
      setShareMessage('텍스트가 복사되었습니다! 인스타그램 스토리에 붙여넣기 하세요.')
      setTimeout(() => setShareMessage(''), 3000)
      // Open Instagram app or web
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = 'instagram://app'
      } else {
        window.open('https://www.instagram.com/', '_blank')
      }
    } catch {
      setShareMessage('복사에 실패했습니다.')
      setTimeout(() => setShareMessage(''), 2000)
    }
  }, [shareText])

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
              <p className="text-2xl font-bold text-white">{bestRound.ideaScore}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-violet-300/50 mb-1">프롬프트</p>
              <p className="text-2xl font-bold text-white">{bestRound.promptScore}</p>
            </div>
          </div>
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
                <span className="ml-auto text-lg font-bold text-white">{bestRound.ideaScore}점</span>
              </div>
              <ScoreBar label="창의성" score={bestRound.ideaDetails.creativity} />
              <ScoreBar label="실현 가능성" score={bestRound.ideaDetails.feasibility} />
              <ScoreBar label="구체성" score={bestRound.ideaDetails.specificity} />
              <ScoreBar label="시장성" score={bestRound.ideaDetails.marketability} />
              <ScoreBar label="트렌드 적합도" score={bestRound.ideaDetails.trendAlignment} />
            </div>

            {/* Prompt Score Details */}
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="w-5 h-5 text-sky-400" />
                <span className="font-semibold text-white">프롬프트 구조 평가</span>
                <span className="ml-auto text-lg font-bold text-white">{bestRound.promptScore}점</span>
              </div>
              <ScoreBar label="역할 명확성" score={bestRound.promptDetails.roleClarity} />
              <ScoreBar label="구조 품질" score={bestRound.promptDetails.structureQuality} />
              <ScoreBar label="출력 명세" score={bestRound.promptDetails.outputSpecification} />
            </div>

            {/* AI Feedback */}
            <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <span className="font-semibold text-white">AI 총평</span>
              </div>
              <p className="text-violet-100/80 leading-relaxed text-sm">
                {bestRound.feedback}
              </p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestRound.strengths.length > 0 && (
                <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-white">강점</span>
                  </div>
                  <ul className="space-y-2">
                    {bestRound.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-emerald-100/80">
                        <span className="text-emerald-400 mt-0.5 shrink-0">*</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {bestRound.weaknesses.length > 0 && (
                <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-white">개선점</span>
                  </div>
                  <ul className="space-y-2">
                    {bestRound.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-100/80">
                        <span className="text-amber-400 mt-0.5 shrink-0">*</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Round Comparison (if both rounds) */}
            {round2 && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  <span className="font-semibold text-white">라운드별 상세 결과</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedRound(1)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                      selectedRound === 1
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/[0.05] text-violet-300 hover:bg-white/[0.1]'
                    }`}
                  >
                    Round 1 ({round1.totalScore}점)
                  </button>
                  <button
                    onClick={() => setSelectedRound(2)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                      selectedRound === 2
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/[0.05] text-violet-300 hover:bg-white/[0.1]'
                    }`}
                  >
                    Round 2 ({round2.totalScore}점)
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-violet-300/50 mb-1">주제</p>
                    <p className="text-sm text-white">{displayedRound.topic}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <p className="text-xs text-violet-300/50">작성한 프롬프트</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm text-violet-100/70 whitespace-pre-wrap break-words">
                        {displayedRound.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">아이디어</p>
                      <p className="text-lg font-bold text-white">{displayedRound.ideaScore}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">프롬프트</p>
                      <p className="text-lg font-bold text-white">{displayedRound.promptScore}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-violet-300/40 text-center mt-4">
                  * 최종 점수는 두 라운드 중 더 높은 점수로 평가되었습니다
                </p>
              </div>
            )}

            {/* Single round prompt display */}
            {!round2 && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <span className="font-semibold text-white">작성한 프롬프트</span>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-violet-300/50 mb-1">주제</p>
                  <p className="text-sm text-white mb-3">{round1.topic}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-violet-100/70 whitespace-pre-wrap break-words">
                    {round1.prompt}
                  </p>
                </div>
              </div>
            )}

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
                  <span>카카오톡 공유</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstagramShare}
                  className="py-4 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <InstagramIcon className="w-5 h-5" />
                  <span>인스타 공유</span>
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
                재밌었다면 dwnc go!go!
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
