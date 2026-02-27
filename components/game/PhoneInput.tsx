'use client'

import { useState } from 'react'
import { Phone, ArrowRight, AlertCircle, Trophy, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhoneInputProps {
  onSubmit: (phone: string) => void
}

interface MyRankData {
  rank: number
  score: number
  grade: string
  total_players: number
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function getRawDigits(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

export function PhoneInput({ onSubmit }: PhoneInputProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [rankLoading, setRankLoading] = useState(false)
  const [rankData, setRankData] = useState<MyRankData | null>(null)
  const [rankMessage, setRankMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError('')
    setRankData(null)
    setRankMessage('')
  }

  const handleSubmit = () => {
    const digits = getRawDigits(phone)
    if (digits.length !== 11 || !digits.startsWith('010')) {
      setError('올바른 전화번호를 입력해주세요 (010-XXXX-XXXX)')
      return
    }

    onSubmit(digits)
  }

  const handleCheckRank = async () => {
    const digits = getRawDigits(phone)
    if (digits.length !== 11 || !digits.startsWith('010')) {
      setError('먼저 전화번호를 입력해주세요')
      return
    }
    setRankLoading(true)
    setRankData(null)
    setRankMessage('')
    try {
      const res = await fetch(`/api/game/my-rank?phone=${digits}`)
      const json = await res.json()
      if (res.ok && json.found) {
        setRankData({
          rank: json.rank,
          score: json.score,
          grade: json.grade,
          total_players: json.total_players,
        })
      } else {
        setRankMessage(json.message || '랭킹 조회에 실패했습니다.')
      }
    } catch {
      setRankMessage('네트워크 에러가 발생했습니다.')
    } finally {
      setRankLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const isValid = getRawDigits(phone).length === 11

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/20 border border-violet-500/30 mb-6"
          >
            <Phone className="w-9 h-9 text-violet-400" />
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-3 text-balance">
            프롬프트 배틀
          </h1>
          <p className="text-violet-200/70 text-lg leading-relaxed">
            AI가 당신의 프롬프트를 평가합니다
          </p>
          <p className="text-violet-300/50 text-sm mt-2">
            냉정한 AI 심사위원이 기다립니다
          </p>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-violet-200 mb-3">
            전화번호 입력
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="010-0000-0000"
              className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-violet-300/30 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 text-lg tracking-wide font-mono"
              autoFocus
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <span>시작하기</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleCheckRank}
            disabled={!isValid || rankLoading}
            className="w-full mt-3 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {rankLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <span>조회 중...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>현재 나의 랭킹 조회하기</span>
              </>
            )}
          </button>
        </div>

        {/* Rank Result */}
        <AnimatePresence>
          {rankData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">나의 랭킹</span>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div>
                  <p className="text-xs text-amber-200/50 mb-1">순위</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {rankData.rank}<span className="text-base text-amber-200/60">위</span>
                  </p>
                  <p className="text-xs text-amber-200/40">/ {rankData.total_players}명</p>
                </div>
                <div className="w-px h-12 bg-amber-500/20" />
                <div>
                  <p className="text-xs text-amber-200/50 mb-1">최고 점수</p>
                  <p className="text-3xl font-bold text-white">{rankData.score}</p>
                </div>
                <div className="w-px h-12 bg-amber-500/20" />
                <div>
                  <p className="text-xs text-amber-200/50 mb-1">등급</p>
                  <p className="text-3xl font-bold text-fuchsia-400">{rankData.grade}</p>
                </div>
              </div>
            </motion.div>
          )}
          {rankMessage && !rankData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center text-sm text-amber-200/60 bg-white/[0.04] border border-white/10 rounded-xl py-4 px-5"
            >
              {rankMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-violet-300/40 text-xs mt-6">
          전화번호는 상품 증정을 위한 용도로만 사용됩니다
        </p>
      </motion.div>
    </div>
  )
}
