'use client'

import { useState, useRef } from 'react'
import { PhoneInput } from './PhoneInput'
import { TopicGeneration } from './TopicGeneration'
import { PromptWriting } from './PromptWriting'
import { Evaluating } from './Evaluating'
import { FinalResults } from './FinalResults'
import { generateRandomTopic } from '@/lib/topic-generator'
import { evaluatePrompt } from '@/lib/prompt-evaluator'
import type { RoundData, GameStage } from '@/lib/game-types'

export function GameFlow() {
  const [stage, setStage] = useState<GameStage>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [round1, setRound1] = useState<RoundData | null>(null)
  const [currentTopic, setCurrentTopic] = useState('')

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
  const saveToSupabase = async (roundData: RoundData) => {
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
          round_number: 1,
          score: roundData.totalScore,
        }),
      })
      const json = await res.json()

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
    setStage('topic-1')
  }

  // Topic generated
  const handleTopicGenerated = (topic: string) => {
    setCurrentTopic(topic)
    setStage('writing-1')
  }

  // Change topic locally
  const handleChangeTopic = () => {
    setCurrentTopic(generateRandomTopic())
  }

  // Submit prompt -> evaluate locally
  const handlePromptSubmit = (prompt: string) => {
    setStage('evaluating-1')

    // Simulate brief loading for UX, then evaluate locally
    setTimeout(() => {
      const evaluation = evaluatePrompt(prompt, currentTopic)
      const totalScore = Math.round((evaluation.ideaScore + evaluation.promptScore) / 2)

      const roundData: RoundData = {
        topic: currentTopic,
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

      setRound1(roundData)
      saveToSupabase(roundData)
      setStage('results')
    }, 2000)
  }

  // Restart
  const handleRestart = () => {
    setStage('phone')
    setPhoneNumber('')
    sessionIdRef.current = null
    phoneRef.current = ''
    setRound1(null)
    setCurrentTopic('')
  }

  switch (stage) {
    case 'phone':
      return <PhoneInput onSubmit={handlePhoneSubmit} />

    case 'topic-1':
      return (
        <TopicGeneration
          roundNumber={1}
          onTopicGenerated={handleTopicGenerated}
        />
      )

    case 'writing-1':
      return (
        <PromptWriting
          topic={currentTopic}
          roundNumber={1}
          onChangeTopic={handleChangeTopic}
          onSubmit={handlePromptSubmit}
        />
      )

    case 'evaluating-1':
      return <Evaluating />

    case 'results':
      return (
        <FinalResults
          round1={round1!}
          round2={null}
          sessionId={sessionIdRef.current}
          onRestart={handleRestart}
        />
      )

    default:
      return null
  }
}
