'use client'

import { useState } from 'react'
import { Send, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EXAMPLE_PROMPT = `앱 이름: Daily Wellness
목적: 사용자의 정신적/신체적 건강을 매일 추적하고 향상시키는 웰니스 앱

주요 기능:
1. 일일 기분 추적기
   - 행복/보통/슬픔/불안 등 기분 선택 옵션 제공
   - 짧은 메모 입력 기능 포함
   - 주간/월간 기분 변화를 그래프로 시각화

2. 운동 기록
   - 사용자 맞춤형 운동 목표 설정 (예: 주 3회 러닝)
   - 운동 종류별 기록 (러닝, 요가, 헬스 등)
   - 운동 시간, 소모 칼로리 등 통계 대시보드

3. 명상 및 이완 기법
   - 호흡법, 바디스캔, 집중 명상 등 유형별 제공
   - 사용자 선호도 기반 맞춤 추천

4. 커뮤니티 - 경험 공유 포럼 및 주제별 토론 게시판
5. 알림 - 기분 기록, 운동 목표, 명상 리마인더 제공`

interface PromptWritingProps {
  roundNumber: number
  onSubmit: (prompt: string) => void
}

export function PromptWriting({ roundNumber, onSubmit }: PromptWritingProps) {
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExample, setShowExample] = useState(true)

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
          <h2 className="text-2xl font-bold text-white mb-2">
            자유 주제 앱 개발 프롬프트
          </h2>
          <p className="text-violet-300/60 text-sm">
            원하는 앱을 자유롭게 구상하고, AI에게 전달할 프롬프트를 작성하세요
          </p>
        </div>

        {/* Example prompt card */}
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl mb-6 overflow-hidden">
          <button
            onClick={() => setShowExample(!showExample)}
            className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-200">프롬프트 예시 보기</span>
            </div>
            {showExample ? (
              <ChevronUp className="w-4 h-4 text-violet-300/50" />
            ) : (
              <ChevronDown className="w-4 h-4 text-violet-300/50" />
            )}
          </button>
          <AnimatePresence>
            {showExample && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-violet-100/70 whitespace-pre-wrap leading-relaxed">
                      {EXAMPLE_PROMPT}
                    </p>
                  </div>
                  <p className="text-xs text-violet-300/40 mt-2">
                    위 예시처럼 앱 이름, 목적, 주요 기능을 구체적으로 작성해보세요
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Warning */}
        <div className="flex items-center justify-center gap-2 text-amber-400/70 text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>수정 불가 -- 한 번 제출하면 되돌릴 수 없습니다</span>
        </div>

        {/* Prompt input */}
        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-violet-200 mb-3">
            프롬프트 작성
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`AI에게 전달할 앱 개발 프롬프트를 작성하세요...\n\n팁:\n- 앱의 이름과 목적을 명확히 하세요\n- 주요 기능을 구체적으로 나열하세요\n- 대상 사용자를 정의하세요\n- 기술적 요구사항을 포함하세요`}
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
