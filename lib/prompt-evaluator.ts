interface EvaluationResult {
  ideaScore: number
  promptScore: number
  improvedPrompt: string
  ideaDetails: {
    creativity: number
    feasibility: number
    specificity: number
    marketability: number
    trendAlignment: number
  }
  promptDetails: {
    structureScore: number
    lengthScore: number
    specificityScore: number
    logicScore: number
    repetitionPenalty: number
  }
  strengths: string[]
  weaknesses: string[]
}

// ─── Hard filter: 0점 처리 ───────────────────────────────────────
function isInvalidPrompt(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 5) return true
  if (/^[^가-힣a-zA-Z0-9]+$/.test(trimmed)) return true
  if (/(.)\1{4,}/.test(trimmed)) return true
  if (/^(asdf|qwer|zxcv|1234|ㅁㄴㅇㄹ|ㅂㅈㄷㄱ)/i.test(trimmed)) return true
  return false
}

// ─── 자연어 분석 유틸 ─────────────────────────────────────────────
function analyze(text: string) {
  const words = text.split(/\s+/).filter(Boolean)
  const hasNumber = /\d+/.test(text)
  const hasPurpose = /위해|목적|원한다|하려고|하기 위|을 위한|를 위한/.test(text)
  const hasCondition = /만약|조건|경우|상황|때는|이라면|다면/.test(text)
  const isQuestion = /[?？]$/.test(text.trim()) || /알려줘|설명해|말해줘|알고 싶|궁금/.test(text)
  const connectors = ['왜', '때문에', '하지만', '따라서', '그리고', '또한', '게다가', '반면']
  const connectorCount = connectors.filter(c => text.includes(c)).length
  const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 0)

  // 단어 중복률
  const wordFreq: Record<string, number> = {}
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })
  const duplicates = Object.values(wordFreq).filter(c => c > 1).reduce((a, b) => a + b, 0)
  const dupRate = words.length > 0 ? duplicates / words.length : 0

  // 구체 명사 (두 글자 이상 명사형)
  const concreteNouns = text.match(/[가-힣]{2,}(?:이|가|을|를|의|에|에서|로|으로|와|과|도)/g) || []

  return {
    words,
    wordCount: words.length,
    charCount: text.length,
    hasNumber,
    hasPurpose,
    hasCondition,
    isQuestion,
    connectorCount,
    sentenceCount: sentences.length,
    dupRate,
    concreteNounCount: concreteNouns.length,
  }
}

// ─── 프롬프트 점수 (새 기준) ──────────────────────────────────────
function scorePromptQuality(text: string) {
  if (isInvalidPrompt(text)) {
    return {
      total: 0,
      details: { structureScore: 0, lengthScore: 0, specificityScore: 0, logicScore: 0, repetitionPenalty: 0 }
    }
  }

  const a = analyze(text)
  let base = 50

  // A. 문장 구조 완성도 (0~15)
  let structureScore = 0
  if (a.concreteNounCount >= 1) structureScore += 5
  const hasVerb = /해|해줘|알려|설명|분석|작성|생성|만들|제시|요약|정리/.test(text)
  if (hasVerb) structureScore += 5
  if (a.sentenceCount >= 2) structureScore += 5

  // B. 길이 적절성 (0~10)
  let lengthScore = 0
  if (a.wordCount >= 10) lengthScore += 5
  if (a.charCount >= 30 && a.charCount <= 300) lengthScore += 5
  if (a.charCount > 300) lengthScore -= 5

  // C. 구체성 (0~20)
  let specificityScore = 0
  if (a.hasNumber) specificityScore += 5
  const adjectives = text.match(/구체적|자세|상세|명확|정확|간결|효율|최적|핵심|전문/g) || []
  if (adjectives.length >= 2) specificityScore += 5
  if (a.hasPurpose) specificityScore += 5
  if (a.hasCondition) specificityScore += 5

  // D. 논리 연결성 (0~15)
  const logicScore = Math.min(15, a.connectorCount * 3)

  // E. 반복도 감점 (-10~0)
  let repetitionPenalty = 0
  if (a.dupRate > 0.3) repetitionPenalty = -10
  else if (a.dupRate > 0.2) repetitionPenalty = -5

  // F. 추상도/구체도 균형 (-5~+10)
  let abstractBalance = 0
  const abstractWords = text.match(/좋은|나쁜|좋게|잘|많이|빠르게|효율적|최대한|가능하면/g) || []
  if (abstractWords.length >= 3 && a.concreteNounCount < 2) abstractBalance = -5
  if (a.concreteNounCount >= 5) abstractBalance = 10

  const total = Math.min(100, Math.max(0,
    base + structureScore + lengthScore + specificityScore + logicScore + repetitionPenalty + abstractBalance
  ))

  return {
    total: Math.round(total),
    details: { structureScore, lengthScore, specificityScore, logicScore, repetitionPenalty }
  }
}

// ─── 아이디어 점수 (기존 유지하되 함수명만 분리) ───────────────────
function scoreIdea(prompt: string, topic: string) {
  if (isInvalidPrompt(prompt)) {
    return {
      total: 0,
      details: { creativity: 0, feasibility: 0, specificity: 0, marketability: 0, trendAlignment: 0 }
    }
  }

  let creativity = 55
  let feasibility = 55
  let specificity = 55
  let marketability = 55
  let trendAlignment = 55

  const creativityKw = ['새로운', '창의적', '독특한', '혁신적', '차별화', '감성', '경험', '스토리']
  creativity += creativityKw.filter(kw => prompt.includes(kw)).length * 8
  if (prompt.includes('문제') || prompt.includes('해결') || prompt.includes('필요')) creativity += 10
  if (prompt.includes('왜') || prompt.includes('어떻게')) creativity += 8
  const innovKw = ['재해석', '전환', '조합', '통합', '융합', '개선']
  creativity += innovKw.filter(kw => prompt.includes(kw)).length * 7

  const practKw = ['간단', '쉽게', '편리', '실용적', '현실적', '가능']
  feasibility += practKw.filter(kw => prompt.includes(kw)).length * 8
  const techKw = ['기술', '알고리즘', '시스템', '자동화', '데이터']
  feasibility += techKw.filter(kw => prompt.includes(kw)).length * 7
  if (['복잡한', '어려운', '고급'].some(w => prompt.includes(w))) feasibility -= 8
  if (prompt.includes('방법') || prompt.includes('절차') || prompt.includes('단계')) feasibility += 12

  const specKw = ['기능', '서비스', '앱', '플랫폼', '시스템', '알림', '추천', '분석', '데이터']
  specificity += specKw.filter(kw => prompt.includes(kw)).length * 9
  const topicParts = topic.split('/').map(p => p.trim())
  if (topicParts.some(part => prompt.includes(part.replace('을(를) 위한', '').trim()))) specificity += 15
  const detailKw = ['구체적으로', '상세히', '정확히', '명확히']
  specificity += detailKw.filter(kw => prompt.includes(kw)).length * 9
  if (prompt.includes('사용자') || prompt.includes('대상') || prompt.includes('고객')) specificity += 10
  if (prompt.includes('상황') || prompt.includes('시나리오') || prompt.includes('경우')) specificity += 8

  const appealKw = ['편리', '간편', '쉬운', '빠른', '즉시', '한번에', '자동']
  marketability += appealKw.filter(kw => prompt.includes(kw)).length * 10
  if (prompt.includes('사용자') || prompt.includes('고객') || prompt.includes('이용자')) marketability += 12
  if (prompt.includes('경험') || prompt.includes('만족') || prompt.includes('즐거움')) marketability += 10
  if (prompt.includes('불편') || prompt.includes('어려움') || prompt.includes('힘든')) marketability += 12
  if (prompt.includes('해결') && (prompt.includes('문제') || prompt.includes('pain'))) marketability += 15
  if (['공유', '소셜', '커뮤니티', '친구', '함께', '연결'].some(kw => prompt.includes(kw))) marketability += 12

  const aiKw = ['AI', '인공지능', '생성형', 'GPT', '챗봇', '자동화', '머신러닝', '학습']
  trendAlignment += aiKw.filter(kw => prompt.includes(kw)).length * 12
  const persoKw = ['개인화', '맞춤', '취향', '추천', '큐레이션', '나만의']
  trendAlignment += persoKw.filter(kw => prompt.includes(kw)).length * 10
  if (['친환경', '지속가능', '재활용', '에코', '탄소', '그린'].some(kw => prompt.includes(kw))) trendAlignment += 11
  if (['생산성', '효율', '시간절약', '관리', '최적화'].some(kw => prompt.includes(kw))) trendAlignment += 10
  if (['데이터', '분석', '통계', '인사이트', '지표'].some(kw => prompt.includes(kw))) trendAlignment += 8

  creativity = Math.min(100, Math.max(0, creativity))
  feasibility = Math.min(100, Math.max(0, feasibility))
  specificity = Math.min(100, Math.max(0, specificity))
  marketability = Math.min(100, Math.max(0, marketability))
  trendAlignment = Math.min(100, Math.max(0, trendAlignment))

  let total = Math.round((creativity + feasibility + specificity + marketability + trendAlignment) / 5)
  if (total < 90 && total >= 60) {
    const bonus = Math.min(8, Math.round((90 - total) * 0.15))
    total = Math.min(89, total + bonus)
  }

  return { total, details: { creativity, feasibility, specificity, marketability, trendAlignment } }
}

// ─── 강점/약점 생성 ───────────────────────────────────────────────
function buildStrengthsWeaknesses(
  ideaDetails: ReturnType<typeof scoreIdea>['details'],
  promptDetails: ReturnType<typeof scorePromptQuality>['details'],
  prompt: string
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (ideaDetails.creativity >= 70) strengths.push('창의적이고 독창적인 아이디어 접근')
  else if (ideaDetails.creativity < 50) weaknesses.push('아이디어의 독창성이 부족합니다')

  if (ideaDetails.feasibility >= 70) strengths.push('실현 가능성이 높은 현실적 제안')
  else if (ideaDetails.feasibility < 50) weaknesses.push('실행 가능성을 높이는 구체적 방안 필요')

  if (ideaDetails.specificity >= 70) strengths.push('구체적이고 명확한 문제 정의')
  else if (ideaDetails.specificity < 50) weaknesses.push('주제에 대한 구체성과 세부 사항 보완 필요')

  if (ideaDetails.marketability >= 70) strengths.push('시장에서의 수요와 관련성이 높음')
  else if (ideaDetails.marketability < 50) weaknesses.push('시장에서의 수요와 관련성을 높이는 방안 필요')

  if (promptDetails.structureScore >= 10) strengths.push('체계적이고 논리적인 프롬프트 구조')
  else if (promptDetails.structureScore < 5) weaknesses.push('프롬프트 구조와 논리성 개선 필요')

  if (promptDetails.specificityScore >= 15) strengths.push('출력 형식과 조건이 구체적으로 명시됨')
  else if (promptDetails.specificityScore < 5) weaknesses.push('원하는 출력 형식과 조건을 더 상세히 작성하세요')

  if (prompt.length > 200) strengths.push('충분한 분량으로 상세한 설명 제공')

  while (strengths.length < 2) strengths.push(strengths.length === 0
    ? '주제를 이해하고 접근하려는 시도가 보입니다'
    : '프롬프트 작성에 대한 기본 이해가 있습니다')
  while (weaknesses.length < 2) weaknesses.push(weaknesses.length === 0
    ? '더 구체적인 설명을 추가하면 좋겠습니다'
    : '실행 가능한 세부 방안을 보완해보세요')

  return { strengths: strengths.slice(0, 2), weaknesses: weaknesses.slice(0, 2) }
}

// ─── 개선된 프롬프트 생성 ─────────────────────────────────────────
function buildImprovedPrompt(original: string): string {
  const a = analyze(original)
  const parts: string[] = []

  // 원문 기반 핵심 문장 (마지막 마침표 제거 후 사용)
  let base = original.trim().replace(/[.。!！?？]+$/, '')

  // 질문형이 아니면 설명 요청으로 변환
  if (!a.isQuestion) {
    base = `${base}에 대해 구체적으로 설명해 주세요`
  }
  parts.push(base + '.')

  // 수치 미포함 → 수치 요청 추가
  if (!a.hasNumber) {
    parts.push('가능하다면 관련 수치나 통계도 포함해 주세요.')
  }

  // 목적 없음 → 목적 문장 추가
  if (!a.hasPurpose) {
    parts.push('이 정보를 실제로 활용할 수 있는 목적과 맥락도 함께 고려해 주세요.')
  }

  // 조건 없음 → 조건 추가
  if (!a.hasCondition) {
    parts.push('특정 조건이나 상황별 차이가 있다면 구분하여 설명해 주세요.')
  }

  // 너무 짧음 → 출력 형식 요청
  if (a.wordCount < 10) {
    parts.push('핵심 요소를 단계별로 정리하고, 예시도 포함해 주세요.')
  }

  // 연결어 없음 → 논리 구조 요청
  if (a.connectorCount === 0) {
    parts.push('원인과 결과를 논리적으로 연결하여 설명해 주세요.')
  }

  return parts.join('\n')
}

// ─── 메인 평가 함수 ───────────────────────────────────────────────
export function evaluatePrompt(prompt: string, topic: string): EvaluationResult {
  if (isInvalidPrompt(prompt)) {
    return {
      ideaScore: 0,
      promptScore: 0,
      improvedPrompt: '유효한 프롬프트를 입력해 주세요.',
      ideaDetails: { creativity: 0, feasibility: 0, specificity: 0, marketability: 0, trendAlignment: 0 },
      promptDetails: { structureScore: 0, lengthScore: 0, specificityScore: 0, logicScore: 0, repetitionPenalty: 0 },
      strengths: ['프롬프트 작성에 도전해보세요', '기본 아이디어를 정리해보세요'],
      weaknesses: ['5자 이상의 의미 있는 문장을 작성해주세요', '구체적인 주제를 포함해주세요'],
    }
  }

  const ideaEval = scoreIdea(prompt, topic)
  const promptEval = scorePromptQuality(prompt)
  const sw = buildStrengthsWeaknesses(ideaEval.details, promptEval.details, prompt)
  const improvedPrompt = buildImprovedPrompt(prompt)

  return {
    ideaScore: Math.min(100, Math.max(0, ideaEval.total)),
    promptScore: Math.min(100, Math.max(0, promptEval.total)),
    improvedPrompt,
    ideaDetails: ideaEval.details,
    promptDetails: promptEval.details,
    strengths: sw.strengths,
    weaknesses: sw.weaknesses,
  }
}
