'use client'

import { useState, useRef } from 'react'
import { PhoneInput } from './PhoneInput'
import { PromptWriting } from './PromptWriting'
import { Evaluating } from './Evaluating'
import { FinalResults } from './FinalResults'
import { BGMPlayer } from './BGMPlayer'
import { evaluatePrompt } from '@/lib/prompt-evaluator'
import type { RoundData, GameStage } from '@/lib/game-types'

const FREE_TOPIC = '자유 주제 - 앱 개발 프롬프트'

export function GameFlow() {
  const [stage, setStage] = useState<GameStage>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [roundData, setRoundData] = useState<RoundData | null>(null)

  const sessionIdRef = useRef<string | null>(null)
  const phoneRef = useRef<string>('')

  const createSession = async (phone: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/game/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      })
      const json = await res.json()

      if (!res.ok || !json.session_id) {
        console.error('[v0] Failed to create session:', json.error)
        return null
      }

      sessionIdRef.current = json.session_id
      return json.session_id
    } catch (e) {
      console.error('[v0] Failed to create session:', e)
      return null
    }
  }

  const saveToSupabase = async (data: RoundData) => {
    const currentSessionId = sessionIdRef.current
    const currentPhone = phoneRef.current

    if (!currentSessionId) return
    try {
      await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          phone_number: currentPhone,
          round_number: 1,
          score: data.totalScore,
          prompt_text: data.prompt,
        }),
      })
    } catch {
      // silently fail
    }
  }

  const handlePhoneSubmit = async (phone: string) => {
    setPhoneNumber(phone)
    phoneRef.current = phone
    await createSession(phone)
    setStage('writing')
  }

  const handlePromptSubmit = (prompt: string) => {
    setStage('evaluating')

    setTimeout(() => {
      const evaluation = evaluatePrompt(prompt, FREE_TOPIC)

      const data: RoundData = {
        topic: FREE_TOPIC,
        prompt,
        promptScore: evaluation.promptScore,
        totalScore: evaluation.promptScore,
        promptDetails: evaluation.promptDetails,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      }

      setRoundData(data)
      saveToSupabase(data)
      setStage('results')
    }, 2000)
  }

  const handleRestart = () => {
    setStage('phone')
    setPhoneNumber('')
    sessionIdRef.current = null
    phoneRef.current = ''
    setRoundData(null)
  }

  const bgmTrack = stage === 'phone' ? 'lobby'
    : stage === 'writing' ? 'writing'
    : stage === 'evaluating' ? 'evaluating'
    : 'results' as const

  const renderStage = () => {
    switch (stage) {
      case 'phone':
        return <PhoneInput onSubmit={handlePhoneSubmit} />

      case 'writing':
        return (
          <PromptWriting
            key={phoneRef.current}
            roundNumber={1}
            onSubmit={handlePromptSubmit}
          />
        )

      case 'evaluating':
        return <Evaluating />

      case 'results':
        return (
          <FinalResults
            roundData={roundData!}
            sessionId={sessionIdRef.current}
            phoneNumber={phoneRef.current}
            onRestart={handleRestart}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      <BGMPlayer track={bgmTrack} />
      {renderStage()}
    </>
  )
}
