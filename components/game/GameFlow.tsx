'use client'

import { useState, useRef } from 'react'
import { PhoneInput } from './PhoneInput'
import { TopicGeneration } from './TopicGeneration'
import { PromptWriting } from './PromptWriting'
import { Evaluating } from './Evaluating'
import { RoundEvaluation } from './RoundEvaluation'
import { FinalResults } from './FinalResults'
import { generateRandomTopic } from '@/lib/topic-generator'
import { evaluatePrompt } from '@/lib/prompt-evaluator'
import { createClient } from '@/lib/supabase/client'
import type { RoundData, GameStage } from '@/lib/game-types'

export function GameFlow() {
  const [stage, setStage] = useState<GameStage>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [round1, setRound1] = useState<RoundData | null>(null)
  const [round2, setRound2] = useState<RoundData | null>(null)
  const [currentTopic, setCurrentTopic] = useState('')

  // Use ref to avoid stale closure issues in setTimeout callbacks
  const sessionIdRef = useRef<string | null>(null)
  const phoneRef = useRef<string>('')

  // Create a game session in Supabase when user enters phone number
  const createSession = async (phone: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      console.log('[v0] Creating session for phone:', phone)

      const { data, error } = await supabase
        .from('game_sessions')
        .insert({ phone_number: phone })
        .select('session_id')
        .single()

      console.log('[v0] Create session result:', { data, error })

      if (error) {
        console.error('[v0] Failed to create session:', error)
        return null
      }
      if (data) {
        sessionIdRef.current = data.session_id
        console.log('[v0] Session created, session_id:', data.session_id)
        return data.session_id
      }
      return null
    } catch (e) {
      console.error('[v0] Failed to create session:', e)
      return null
    }
  }

  // Save round score to Supabase
  const saveToSupabase = async (roundData: RoundData, roundNumber: number) => {
    const currentSessionId = sessionIdRef.current
    const currentPhone = phoneRef.current
    console.log('[v0] saveToSupabase called:', { currentSessionId, currentPhone, roundNumber, score: roundData.totalScore })

    if (!currentSessionId) {
      console.error('[v0] No session_id available, skipping save')
      return
    }
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('game_scores').insert({
        session_id: currentSessionId,
        phone_number: currentPhone,
        round_number: roundNumber,
        score: roundData.totalScore,
      }).select()

      console.log('[v0] Save score result:', { data, error })

      if (error) {
        console.error('[v0] Failed to save score:', error)
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
    if (stage === 'topic-1') setStage('writing-1')
    else if (stage === 'topic-2') setStage('writing-2')
  }

  // Change topic locally
  const handleChangeTopic = () => {
    setCurrentTopic(generateRandomTopic())
  }

  // Submit prompt -> evaluate locally
  const handlePromptSubmit = (prompt: string) => {
    const isRound1 = stage === 'writing-1'
    setStage(isRound1 ? 'evaluating-1' : 'evaluating-2')

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
  const handleContinueToRound2 = () => setStage('topic-2')
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
    setCurrentTopic('')
  }

  switch (stage) {
    case 'phone':
      return <PhoneInput onSubmit={handlePhoneSubmit} />

    case 'topic-1':
    case 'topic-2':
      return (
        <TopicGeneration
          roundNumber={stage === 'topic-1' ? 1 : 2}
          onTopicGenerated={handleTopicGenerated}
        />
      )

    case 'writing-1':
    case 'writing-2':
      return (
        <PromptWriting
          topic={currentTopic}
          roundNumber={stage === 'writing-1' ? 1 : 2}
          onChangeTopic={handleChangeTopic}
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
