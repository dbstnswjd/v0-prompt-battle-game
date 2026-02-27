'use client'

import { useState, useRef } from 'react'
import { PhoneInput } from './PhoneInput'
import { PromptWriting } from './PromptWriting'
import { Evaluating } from './Evaluating'
import { RoundEvaluation } from './RoundEvaluation'
import { FinalResults } from './FinalResults'
import { evaluatePrompt } from '@/lib/prompt-evaluator'
import type { RoundData, GameStage } from '@/lib/game-types'

const FREE_TOPIC = '자유 주제 - 앱 개발 프롬프트'

export function GameFlow() {
  const [stage, setStage] = useState<GameStage>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [round1, setRound1] = useState<RoundData | null>(null)
  const [round2, setRound2] = useState<RoundData | null>(null)

  // Use ref to avoid stale closure issues in setTimeout callbacks
  const sessionIdRef = useRef<string | null>(null)
  const phoneRef = useRef<string>('')

  // Create a game session via API route
  const createSession = async (phone: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/game/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      })
      const json = await res.json()
      console.log('[v0] Create session API response:', json)

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

  // Save round score via API route
  const saveToSupabase = async (roundData: RoundData, roundNumber: number) => {
    const currentSessionId = sessionIdRef.current
    const currentPhone = phoneRef.current

    if (!currentSessionId) {
      console.error('[v0] No session_id available, skipping save')
      return
    }
    try {
      const res = await fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          phone_number: currentPhone,
          round_number: roundNumber,
          score: roundData.totalScore,
        }),
      })
      const json = await res.json()
      console.log('[v0] Save score API response:', json)

      if (!res.ok) {
        console.error('[v0] Failed to save score:', json.error)
      }
    } catch (e) {
      console.error('[v0] Failed to save to Supabase:', e)
    }
  }

  // Phone submit
  const handlePhoneSubmit = async (phone: string) => {
    setPhoneNumber(phone)
    phoneRef.current = phone
    await createSession(phone)
    setStage('writing-1')
  }

  // Submit prompt -> evaluate locally
  const handlePromptSubmit = (prompt: string) => {
    const isRound1 = stage === 'writing-1'
    setStage(isRound1 ? 'evaluating-1' : 'evaluating-2')

    // Simulate brief loading for UX, then evaluate locally
    setTimeout(() => {
      const evaluation = evaluatePrompt(prompt, FREE_TOPIC)
      const totalScore = Math.round((evaluation.ideaScore + evaluation.promptScore) / 2)

      const roundData: RoundData = {
        topic: FREE_TOPIC,
        prompt,
        ideaScore: evaluation.ideaScore,
        promptScore: evaluation.promptScore,
        totalScore,
        ideaDetails: evaluation.ideaDetails,
        promptDetails: evaluation.promptDetails,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      }

      if (isRound1) {
        setRound1(roundData)
        saveToSupabase(roundData, 1)
        setStage('evaluation-1')
      } else {
        setRound2(roundData)
        saveToSupabase(roundData, 2)
        setStage('evaluation-2')
      }
    }, 2000)
  }

  // Round 1 evaluation -> continue or skip
  const handleContinueToRound2 = () => setStage('writing-2')
  const handleSkipToResults = () => setStage('results')
  const handleViewResults = () => setStage('results')

  // Restart
  const handleRestart = () => {
    setStage('phone')
    setPhoneNumber('')
    sessionIdRef.current = null
    phoneRef.current = ''
    setRound1(null)
    setRound2(null)
  }

  switch (stage) {
    case 'phone':
      return <PhoneInput onSubmit={handlePhoneSubmit} />

    case 'writing-1':
    case 'writing-2':
      return (
        <PromptWriting
          roundNumber={stage === 'writing-1' ? 1 : 2}
          onSubmit={handlePromptSubmit}
        />
      )

    case 'evaluating-1':
    case 'evaluating-2':
      return <Evaluating />

    case 'evaluation-1':
      return (
        <RoundEvaluation
          roundNumber={1}
          roundData={round1!}
          onContinue={handleContinueToRound2}
          onSkip={handleSkipToResults}
        />
      )

    case 'evaluation-2':
      return (
        <RoundEvaluation
          roundNumber={2}
          roundData={round2!}
          onViewResults={handleViewResults}
        />
      )

    case 'results':
      return (
        <FinalResults
          round1={round1!}
          round2={round2}
          onRestart={handleRestart}
        />
      )

    default:
      return null
  }
}
