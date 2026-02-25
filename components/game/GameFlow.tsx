'use client'

import { useState, useCallback } from 'react'
import { PhoneInput } from './PhoneInput'
import { TopicGeneration } from './TopicGeneration'
import { PromptWriting } from './PromptWriting'
import { Evaluating } from './Evaluating'
import { RoundEvaluation } from './RoundEvaluation'
import { FinalResults } from './FinalResults'
import { generateRandomTopic } from '@/lib/topic-generator'
import type { RoundData, GameStage } from '@/lib/game-types'

export function GameFlow() {
  const [stage, setStage] = useState<GameStage>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [round1, setRound1] = useState<RoundData | null>(null)
  const [round2, setRound2] = useState<RoundData | null>(null)
  const [currentTopic, setCurrentTopic] = useState('')

  const incrementRoundCount = useCallback((phone: string) => {
    const key = `promptBattle_rounds_${phone}`
    const current = parseInt(localStorage.getItem(key) || '0', 10)
    localStorage.setItem(key, String(current + 1))
  }, [])

  // Phone submit
  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone)
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

  // Submit prompt -> evaluate via AI
  const handlePromptSubmit = async (prompt: string) => {
    const isRound1 = stage === 'writing-1'
    setStage(isRound1 ? 'evaluating-1' : 'evaluating-2')

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, topic: currentTopic }),
      })

      if (!res.ok) throw new Error('Evaluation failed')

      const evaluation = await res.json()

      const roundData: RoundData = {
        topic: currentTopic,
        prompt,
        totalScore: Math.round(evaluation.totalScore),
        creativityScore: Math.round(evaluation.creativityScore),
        feasibilityScore: Math.round(evaluation.feasibilityScore),
        profitabilityScore: Math.round(evaluation.profitabilityScore),
        structureScore: Math.round(evaluation.structureScore),
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
      }

      if (isRound1) {
        setRound1(roundData)
        incrementRoundCount(phoneNumber)
        setStage('evaluation-1')
      } else {
        setRound2(roundData)
        incrementRoundCount(phoneNumber)
        setStage('evaluation-2')
      }
    } catch {
      // Fallback: generate mock scores if API fails
      const mockData: RoundData = {
        topic: currentTopic,
        prompt,
        totalScore: 50,
        creativityScore: 50,
        feasibilityScore: 50,
        profitabilityScore: 50,
        structureScore: 50,
        feedback: '평가 중 오류가 발생했습니다. 기본 점수로 표시됩니다.',
        strengths: ['프롬프트를 제출했습니다.'],
        weaknesses: ['AI 평가 서버에 연결할 수 없었습니다.'],
      }

      if (isRound1) {
        setRound1(mockData)
        incrementRoundCount(phoneNumber)
        setStage('evaluation-1')
      } else {
        setRound2(mockData)
        incrementRoundCount(phoneNumber)
        setStage('evaluation-2')
      }
    }
  }

  // Round 1 evaluation -> continue or skip
  const handleContinueToRound2 = () => setStage('topic-2')
  const handleSkipToResults = () => setStage('results')
  const handleViewResults = () => setStage('results')

  // Restart
  const handleRestart = () => {
    setStage('phone')
    setPhoneNumber('')
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
