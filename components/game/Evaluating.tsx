'use client'

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

export function Evaluating() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-violet-500/20 border border-violet-500/30 mb-8"
        >
          <Brain className="w-12 h-12 text-violet-400" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">
          AI가 프롬프트를 분석하고 있습니다
        </h2>

        <p className="text-violet-200/60 mb-8 leading-relaxed">
          아이디어의 창의성, 실현 가능성, 시장성과
          <br />
          프롬프트 구조를 냉정하게 평가 중입니다...
        </p>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 rounded-full bg-violet-400"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
