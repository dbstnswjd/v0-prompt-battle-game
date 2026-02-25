'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, Share2, RotateCcw, CheckCircle, XCircle, MessageSquare, FileText, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { RoundData } from '@/lib/game-types'
import { getGrade, getGradeColor } from '@/lib/game-types'

interface FinalResultsProps {
  round1: RoundData
  round2: RoundData | null
  onRestart: () => void
}

function ScoreBar({ label, score }: { label: string; score: number }) {
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
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
        />
      </div>
    </div>
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

  const handleShare = useCallback(async () => {
    const text = `프롬프트 배틀에서 ${finalScore}점 (${grade}등급)을 받았습니다!\n주제: ${bestRound.topic}\n\n프롬프트는 감각이 아니라 설계다. 단 2번의 기회, AI가 판단한다.`

    if (navigator.share) {
      try {
        await navigator.share({ title: '프롬프트 배틀 결과', text })
        return
      } catch {
        // User cancelled or error
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setShareMessage('결과가 클립보드에 복사되었습니다!')
      setTimeout(() => setShareMessage(''), 2000)
    } catch {
      setShareMessage('복사에 실패했습니다.')
      setTimeout(() => setShareMessage(''), 2000)
    }
  }, [finalScore, grade, bestRound.topic])

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
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${animatedScore}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            />
          </div>
        </div>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Best Round Score Bars */}
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-violet-300/70 mb-2">
                {round2 ? '최고 점수 라운드 상세' : '점수 상세'}
              </h3>
              <ScoreBar label="창의성" score={bestRound.creativityScore} />
              <ScoreBar label="실현 가능성" score={bestRound.feasibilityScore} />
              <ScoreBar label="수익성" score={bestRound.profitabilityScore} />
              <ScoreBar label="프롬프트 구조" score={bestRound.structureScore} />
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
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">창의성</p>
                      <p className="text-lg font-bold text-white">{displayedRound.creativityScore}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">실현성</p>
                      <p className="text-lg font-bold text-white">{displayedRound.feasibilityScore}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">수익성</p>
                      <p className="text-lg font-bold text-white">{displayedRound.profitabilityScore}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-lg p-3 text-center">
                      <p className="text-xs text-violet-300/50 mb-1">구조</p>
                      <p className="text-lg font-bold text-white">{displayedRound.structureScore}</p>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                <span>결과 공유하기</span>
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
