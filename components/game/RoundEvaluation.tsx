'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, SkipForward, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import type { RoundData } from '@/lib/game-types'
import { getGrade, getGradeColor } from '@/lib/game-types'

interface RoundEvaluationProps {
  roundNumber: number
  roundData: RoundData
  onContinue?: () => void
  onSkip?: () => void
  onViewResults?: () => void
}

function ScoreBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const step = score / 30
      const interval = setInterval(() => {
        current += step
        if (current >= score) {
          setAnimated(score)
          clearInterval(interval)
        } else {
          setAnimated(Math.floor(current))
        }
      }, 20)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-violet-200">{label}</span>
        <span className="text-sm font-semibold text-white">{animated}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${animated}%` }}
          transition={{ duration: 0.8, delay: delay / 1000 }}
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
        />
      </div>
    </div>
  )
}

export function RoundEvaluation({
  roundNumber,
  roundData,
  onContinue,
  onSkip,
  onViewResults,
}: RoundEvaluationProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const grade = getGrade(roundData.totalScore)
  const gradeColors = getGradeColor(grade)

  useEffect(() => {
    let current = 0
    const increment = roundData.totalScore / 50
    const timer = setInterval(() => {
      current += increment
      if (current >= roundData.totalScore) {
        setAnimatedScore(roundData.totalScore)
        clearInterval(timer)
        setTimeout(() => setShowDetails(true), 400)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, 20)
    return () => clearInterval(timer)
  }, [roundData.totalScore])

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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4 border border-emerald-500/30"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Round {roundNumber} 완료
          </h2>
        </div>

        {/* Total Score */}
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-6 text-center">
          <p className="text-sm text-violet-300/70 mb-3">총점</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-7xl font-bold text-white tabular-nums">
              {animatedScore}
            </span>
            <div className={`px-4 py-2 ${gradeColors.bg} ${gradeColors.border} border rounded-xl`}>
              <span className={`text-3xl font-bold ${gradeColors.text}`}>
                {grade}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${animatedScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
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
            {/* 4 Score Bars */}
            <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <ScoreBar label="창의성" score={roundData.creativityScore} delay={0} />
              <ScoreBar label="실현 가능성" score={roundData.feasibilityScore} delay={150} />
              <ScoreBar label="수익성" score={roundData.profitabilityScore} delay={300} />
              <ScoreBar label="프롬프트 구조" score={roundData.structureScore} delay={450} />
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

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {roundNumber === 1 && onContinue && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinue}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>다음 라운드 도전하기</span>
                </motion.button>
              )}

              {roundNumber === 1 && onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full py-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-violet-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <SkipForward className="w-5 h-5" />
                  <span>여기서 끝내기</span>
                </button>
              )}

              {roundNumber === 2 && onViewResults && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewResults}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span>최종 결과 보기</span>
                </motion.button>
              )}
            </div>

            {roundNumber === 1 && (
              <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-xl p-4 text-center">
                <p className="text-sm text-violet-200/60">
                  Round 2에서는 완전히 새로운 주제가 주어집니다.
                  <br />
                  최종 점수는 두 라운드 중 더 높은 점수로 결정됩니다.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
