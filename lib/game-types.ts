export interface RoundData {
  topic: string
  prompt: string
  ideaScore: number
  promptScore: number
  totalScore: number
  ideaDetails: {
    creativity: number
    feasibility: number
    specificity: number
    marketability: number
    trendAlignment: number
  }
  promptDetails: {
    roleClarity: number
    structureQuality: number
    outputSpecification: number
  }
  feedback: string
  strengths: string[]
  weaknesses: string[]
}

export type GameStage =
  | 'phone'
  | 'writing-1'
  | 'evaluating-1'
  | 'evaluation-1'
  | 'writing-2'
  | 'evaluating-2'
  | 'evaluation-2'
  | 'results'

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export function getGrade(score: number): Grade {
  if (score >= 90) return 'S'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

export function getGradeColor(grade: Grade) {
  switch (grade) {
    case 'S':
      return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' }
    case 'A':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
    case 'B':
      return { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30' }
    case 'C':
      return { text: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30' }
    case 'D':
      return { text: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
  }
}
