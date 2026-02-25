'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateRandomTopic, getRandomDisplayTopics } from '@/lib/topic-generator'

interface TopicGenerationProps {
  roundNumber: number
  onTopicGenerated: (topic: string) => void
}

export function TopicGeneration({ roundNumber, onTopicGenerated }: TopicGenerationProps) {
  const [displayTopics] = useState(() => getRandomDisplayTopics(20))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finalTopic, setFinalTopic] = useState('')
  const [phase, setPhase] = useState<'spinning' | 'slowing' | 'done'>('spinning')
  const [progress, setProgress] = useState(0)

  const startGeneration = useCallback(() => {
    const topic = generateRandomTopic()
    setFinalTopic(topic)

    // Fast spinning phase (0-60%)
    let idx = 0
    const fastInterval = setInterval(() => {
      idx = (idx + 1) % displayTopics.length
      setCurrentIndex(idx)
    }, 80)

    setTimeout(() => {
      clearInterval(fastInterval)
      setPhase('slowing')

      // Slowing phase (60-90%)
      let slowIdx = idx
      let delay = 120
      const slowStep = () => {
        slowIdx = (slowIdx + 1) % displayTopics.length
        setCurrentIndex(slowIdx)
        delay += 60
        if (delay < 600) {
          setTimeout(slowStep, delay)
        } else {
          setPhase('done')
        }
      }
      setTimeout(slowStep, delay)
    }, 1600)
  }, [displayTopics])

  useEffect(() => {
    startGeneration()
  }, [startGeneration])

  // Progress animation
  useEffect(() => {
    const targetProgress = phase === 'spinning' ? 60 : phase === 'slowing' ? 90 : 100
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(timer)
          return targetProgress
        }
        return prev + 1
      })
    }, phase === 'spinning' ? 25 : phase === 'slowing' ? 30 : 20)
    return () => clearInterval(timer)
  }, [phase])

  // Auto-proceed after done
  useEffect(() => {
    if (phase === 'done' && finalTopic) {
      const timer = setTimeout(() => {
        onTopicGenerated(finalTopic)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, finalTopic, onTopicGenerated])

  const displayedTopic = phase === 'done' ? finalTopic : displayTopics[currentIndex]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full mb-8 border border-violet-500/30">
            <span className="text-violet-300 font-medium">
              Round {roundNumber}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            주제를 생성하고 있습니다
          </h2>

          <motion.div
            animate={{ rotate: phase === 'done' ? 0 : 360 }}
            transition={{
              duration: phase === 'spinning' ? 1 : 2,
              repeat: phase === 'done' ? 0 : Infinity,
              ease: 'linear',
            }}
            className="flex justify-center mb-8"
          >
            <Sparkles className="w-12 h-12 text-violet-400" />
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Slot machine display */}
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-8 overflow-hidden min-h-[120px] flex flex-col items-center justify-center">
          <p className="text-sm text-violet-300/70 mb-4">
            {phase === 'done' ? '당신의 주제' : '주제 선정 중...'}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={displayedTopic}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: phase === 'spinning' ? 0.06 : 0.15 }}
              className={`text-xl font-bold leading-relaxed ${
                phase === 'done' ? 'text-white' : 'text-white/60'
              }`}
            >
              {displayedTopic}
            </motion.p>
          </AnimatePresence>
        </div>

        {phase === 'done' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-violet-300/50 text-sm mt-4"
          >
            잠시 후 프롬프트 작성 화면으로 이동합니다...
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
