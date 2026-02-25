'use client'

import { useState } from 'react'
import { Send, AlertCircle, Shuffle } from 'lucide-react'
import { motion } from 'framer-motion'

interface PromptWritingProps {
  topic: string
  roundNumber: number
  onChangeTopic: () => void
  onSubmit: (prompt: string) => void
}

export function PromptWriting({ topic, roundNumber, onChangeTopic, onSubmit }: PromptWritingProps) {
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setTimeout(() => {
      onSubmit(prompt || '(작성하지 않음)')
    }, 400)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full mb-6 border border-violet-500/30">
            <span className="text-violet-300 font-medium">Round {roundNumber}</span>
          </div>

          {/* Topic card */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 relative">
            <p className="text-sm text-violet-300/70 mb-2">주제</p>
            <p className="text-xl font-bold text-white leading-relaxed pr-24">
              {topic}
            </p>

            <button
              onClick={onChangeTopic}
              className="absolute top-4 right-4 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/40 text-violet-200 border border-violet-500/30 cursor-pointer"
              title="주제 변경"
            >
              <Shuffle className="w-4 h-4" />
              <span className="text-sm">주제 변경</span>
            </button>
          </div>

          {/* Warning */}
          <div className="flex items-center justify-center gap-2 text-amber-400/70 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>수정 불가 -- 한 번 제출하면 되돌릴 수 없습니다</span>
          </div>
        </div>

        {/* Prompt input */}
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-violet-200 mb-3">
            프롬프트 작성
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`AI에게 전달할 프롬프트를 작성하세요...\n\n예시:\n- 역할을 명확히 정의하세요\n- 출력 형식을 구체적으로 지정하세요\n- 조건과 제약사항을 포함하세요`}
            disabled={isSubmitting}
            className="w-full h-64 px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-violet-300/30 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 resize-none disabled:opacity-50 leading-relaxed"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-violet-300/40">
              {prompt.length} 글자
            </span>
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>제출 중...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>제출하기</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
