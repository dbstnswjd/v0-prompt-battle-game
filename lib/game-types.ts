export interface RoundData {
  topic: string
  prompt: string
  promptScore: number
  totalScore: number
  promptDetails: {
    reqClarity: number       // ① 요구 명확도 0~15
    infoSufficiency: number  // ② 정보 충분성 0~20 (타겟 사용자 포함)
    funcSpec: number         // ③ 기능 명세 완성도 0~15
    specificity: number      // ④ 구체성 수준 0~15
    interpStability: number  // ⑤ 해석 안정성 0~10
    executability: number    // ⑥ 실행 가능성 0~15
    structureOrg: number     // ⑦ 구조 조직력 0~10
    intentConsist: number    // ⑧ 의도 일관성 0~10
    bonus: number            // ⑨ 보정치 -5~+10
  }
  feedback: string
  strengths: string[]
  weaknesses: string[]
}

export type GameStage =
  | 'phone'
  | 'writing'
  | 'evaluating'
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
