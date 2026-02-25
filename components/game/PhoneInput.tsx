'use client'

import { useState } from 'react'
import { Phone, ArrowRight, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface PhoneInputProps {
  onSubmit: (phone: string) => void
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError('')
  }

  const handleSubmit = () => {
    const digits = getRawDigits(phone)
    if (digits.length !== 11 || !digits.startsWith('010')) {
      setError('올바른 전화번호를 입력해주세요 (010-XXXX-XXXX)')
      return
    }

    const storageKey = `promptBattle_rounds_${digits}`
    const roundsPlayed = parseInt(localStorage.getItem(storageKey) || '0', 10)

    if (roundsPlayed >= 2) {
      setError('이미 2라운드를 완료했습니다. 다시 참가할 수 없습니다.')
      return
    }

    onSubmit(digits)
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
            단 2번의 기회, 냉정한 AI 심사위원
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
        </div>

        <p className="text-center text-violet-300/40 text-xs mt-6">
          전화번호는 중복 참여 방지 용도로만 사용됩니다
        </p>
      </motion.div>
    </div>
  )
}
