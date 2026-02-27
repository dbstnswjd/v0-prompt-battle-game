// ─── 타입 정의 ───────────────────────────────────────────────────
interface EvaluationResult {
  promptScore: number
  feedback: string
  promptDetails: {
    clarityScore: number
    stabilityScore: number
    sufficiencyScore: number
    predictabilityScore: number
  }
  strengths: string[]
  weaknesses: string[]
}

// ─── Hard filter ─────────────────────────────────────────────────
function isInvalidPrompt(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 5) return true
  if (/^[^가-힣a-zA-Z0-9]+$/.test(trimmed)) return true
  if (/(.)\1{4,}/.test(trimmed)) return true
  if (/^(asdf|qwer|zxcv|1234|ㅁㄴㅇㄹ|ㅂㅈㄷㄱ)/i.test(trimmed)) return true
  return false
}

// ─── 분석 ────────────────────────────────────────────────────────
function analyze(text: string) {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 0)

  const wordFreq: Record<string, number> = {}
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })
  const uniqueWords = Object.keys(wordFreq).length
  const duplicateWords = Object.values(wordFreq).filter(c => c > 1).reduce((a, b) => a + b, 0)
  const dupRate = words.length > 0 ? duplicateWords / words.length : 0

  const nouns = text.match(/[가-힣]{2,}(?:이|가|을|를|의|에|에서|로|으로|와|과|도|는|은)/g) || []
  const verbs = text.match(/(?:해|해줘|알려|설명|분석|작성|생성|만들|제시|요약|정리|구현|설계|추천)/g) || []

  const hasNumber = /\d+/.test(text)
  const hasProperNoun = /[A-Z][a-z]+|[가-힣]{2,}(?:기업|회사|서비스|플랫폼|앱|시스템)/.test(text)
  const hasTechnicalTerm = /AI|API|UX|UI|DB|SaaS|B2B|B2C|MVP|KPI|ROI|머신러닝|딥러닝|알고리즘|아키텍처/.test(text)
  const hasPurpose = /위해|목적|원한다|하려고|하기 위|을 위한|를 위한|필요|원하는/.test(text)
  const hasCondition = /만약|조건|경우|상황|때는|이라면|다면/.test(text)
  const hasOutputFormat = /표|목록|단계|번호|형식|포맷|정리|요약|예시|샘플|리스트/.test(text)
  const hasTarget = /사용자|고객|대상|타겟|팀|개발자|기획자|마케터|학생|초보|전문가/.test(text)

  const causeConnectors = ['때문에', '따라서', '그러므로', '결과적으로', '이로 인해']
  const contrastConnectors = ['하지만', '그러나', '반면', '반대로', '대신']
  const addConnectors = ['그리고', '또한', '게다가', '뿐만 아니라', '추가로']
  const condConnectors = ['만약', '라면', '경우에는', '조건으로']
  const connectorCount = [...causeConnectors, ...contrastConnectors, ...addConnectors, ...condConnectors]
    .filter(c => text.includes(c)).length

  const abstractWords = text.match(/(?:좋은|나쁜|잘|많이|빠르게|효율적|최대한|가능하면|적당히|멋지게)/g) || []

  return {
    words, wordCount: words.length, charCount: text.length,
    sentences, sentenceCount: sentences.length,
    avgSentenceLen: words.length / Math.max(1, sentences.length),
    uniqueWords, dupRate, nouns, verbs,
    hasNumber, hasProperNoun, hasTechnicalTerm,
    hasPurpose, hasCondition, hasOutputFormat, hasTarget,
    connectorCount, abstractWords,
  }
}

// ─── 4개 평가 항목 점수 계산 ──────────────────────────────────────
function scorePromptQuality(text: string) {
  if (isInvalidPrompt(text)) {
    return {
      total: 0,
      details: { clarityScore: 0, stabilityScore: 0, sufficiencyScore: 0, predictabilityScore: 0 }
    }
  }

  const a = analyze(text)

  // A. 이해 명확도 (Clarity of Intent) 0~25
  let clarityScore = 10
  if (a.verbs.length >= 1) clarityScore += 5
  if (a.nouns.length >= 2) clarityScore += 5
  if (a.hasPurpose) clarityScore += 5
  clarityScore = Math.min(25, clarityScore)

  // B. 해석 범위 안정성 (Interpretation Stability) 0~25
  let stabilityScore = 5
  if (a.hasCondition) stabilityScore += 8
  if (a.hasTarget) stabilityScore += 7
  if (a.connectorCount >= 1) stabilityScore += 5
  if (a.abstractWords.length >= 3) stabilityScore = Math.max(0, stabilityScore - 5)
  stabilityScore = Math.min(25, stabilityScore)

  // C. 정보 충분성 (Information Sufficiency) 0~25
  let sufficiencyScore = 5
  if (a.wordCount >= 10) sufficiencyScore += 5
  if (a.wordCount >= 20) sufficiencyScore += 5
  if (a.hasNumber) sufficiencyScore += 5
  if (a.hasTechnicalTerm || a.hasProperNoun) sufficiencyScore += 5
  if (a.dupRate > 0.3) sufficiencyScore = Math.max(0, sufficiencyScore - 5)
  sufficiencyScore = Math.min(25, sufficiencyScore)

  // D. 결과 예측 가능성 (Output Predictability) 0~25
  let predictabilityScore = 5
  if (a.hasOutputFormat) predictabilityScore += 10
  if (a.sentenceCount >= 2) predictabilityScore += 5
  if (a.hasCondition) predictabilityScore += 5
  predictabilityScore = Math.min(25, predictabilityScore)

  const total = Math.min(100, Math.max(0,
    clarityScore + stabilityScore + sufficiencyScore + predictabilityScore
  ))

  return {
    total: Math.round(total),
    details: { clarityScore, stabilityScore, sufficiencyScore, predictabilityScore }
  }
}

// ─── 자연어 총평 생성 (수치 없는 AI 코칭 톤) ─────────────────────
function buildFeedback(
  prompt: string,
  promptScore: number,
  details: { clarityScore: number; stabilityScore: number; sufficiencyScore: number; predictabilityScore: number }
): string {
  const a = analyze(prompt)
  const sections: string[] = []

  // ① AI가 읽었을 때의 전반적 인상
  let impression = ''
  if (promptScore >= 80) {
    impression = '이 프롬프트는 전반적으로 AI가 요청 의도를 명확하게 파악할 수 있는 구조로 작성되어 있습니다. 요청의 방향이 분명하고, 결과가 예측 가능한 수준으로 구체화되어 있어 일관된 출력을 기대할 수 있습니다.'
  } else if (promptScore >= 60) {
    impression = '이 프롬프트는 기본적인 요청 의도는 잘 전달되지만, 해석의 범위가 다소 넓게 열려 있어 다양한 방향으로 결과가 나올 수 있는 구조입니다. AI 입장에서는 무엇을 원하는지는 이해되지만, 어느 정도 수준까지 답해야 하는지 판단하기 어려울 수 있습니다.'
  } else if (promptScore >= 40) {
    impression = '이 프롬프트는 요청의 의도가 부분적으로 전달되지만, 전체적으로 해석의 여지가 크게 열려 있는 상태입니다. AI가 방향을 스스로 결정해야 하는 부분이 많아, 원하는 결과와 실제 결과가 달라질 가능성이 있습니다.'
  } else {
    impression = '이 프롬프트는 AI가 요청의 핵심을 파악하기 어려운 구조입니다. 맥락이나 목적에 대한 정보가 충분하지 않아, AI가 방향을 임의로 설정할 가능성이 높습니다.'
  }
  sections.push(impression)

  // ② AI가 헷갈릴 수 있는 부분
  const confusions: string[] = []
  if (a.abstractWords.length >= 2) {
    confusions.push(`"${a.abstractWords.slice(0, 2).join('", "')}"와 같은 표현은 해석 기준이 명확하지 않아 결과가 일관되지 않을 가능성이 있습니다.`)
  }
  if (!a.hasTarget) {
    confusions.push('대상이나 맥락이 명시되지 않아 AI가 어떤 수준의 사용자를 위해 답해야 하는지 판단하기 어렵습니다.')
  }
  if (!a.hasOutputFormat) {
    confusions.push('원하는 출력 형식이 정해지지 않아 결과물의 형태가 매번 달라질 수 있습니다.')
  }
  if (!a.hasPurpose) {
    confusions.push('이 요청이 어떤 목적이나 상황을 위한 것인지 맥락이 부족합니다.')
  }
  if (confusions.length > 0) {
    sections.push(confusions.slice(0, 2).join(' '))
  }

  // ③ 잘된 부분
  const goods: string[] = []
  if (details.clarityScore >= 18) goods.push('요청의 핵심 동작이 명확하게 표현되어 AI가 즉시 이해할 수 있습니다.')
  if (details.stabilityScore >= 18) goods.push('조건이나 범위가 어느 정도 한정되어 있어 결과가 예측 가능한 방향으로 수렴할 가능성이 높습니다.')
  if (details.sufficiencyScore >= 18) goods.push('충분한 정보와 맥락이 포함되어 있어 AI가 풍부한 답변을 생성할 수 있는 기반이 갖춰져 있습니다.')
  if (details.predictabilityScore >= 18) goods.push('출력 형식이나 구조가 명확하게 제시되어 원하는 결과물을 얻기 수월한 구조입니다.')
  if (a.hasPurpose) goods.push('요청의 목적이 포함되어 있어 AI가 적절한 수준의 답변을 선택할 수 있습니다.')
  if (a.wordCount >= 20) goods.push('충분한 길이로 작성되어 있어 AI가 다양한 맥락을 활용할 수 있습니다.')

  if (goods.length > 0) {
    sections.push(goods.slice(0, 2).join(' '))
  } else {
    sections.push('기본적인 요청 구조는 갖추고 있으며, 이해하기 어렵지 않은 문장으로 작성되어 있습니다.')
  }

  // ④ 개선 방향 (행동 중심)
  const improvements: string[] = []
  if (!a.hasPurpose) improvements.push('요청의 목적이나 활용 맥락을 한 문장으로 추가해보세요.')
  if (!a.hasTarget) improvements.push('대상 사용자나 상황을 구체적으로 명시하면 훨씬 정밀한 답변을 얻을 수 있습니다.')
  if (!a.hasOutputFormat) improvements.push('원하는 출력 형식(예: "3가지로 나눠서", "표 형태로", "단계별로")을 지정해보세요.')
  if (!a.hasNumber) improvements.push('수량이나 범위에 관한 숫자를 하나 추가하면 결과의 일관성이 높아집니다.')
  if (a.abstractWords.length >= 2 && !a.hasNumber) improvements.push('추상적인 표현 대신 구체적인 기준이나 예시를 포함시켜보세요.')

  if (improvements.length === 0) {
    sections.push('현재 구조를 유지하면서 예외 상황이나 심화 조건을 추가하면 더욱 완성도 높은 결과를 얻을 수 있습니다.')
  } else {
    const picked = improvements.slice(0, 2).join(' ')
    sections.push(`만약 더 구체적인 결과가 필요하다면, ${picked}`)
  }

  return sections.join('\n\n')
}

// ─── 강점 / 약점 생성 ─────────────────────────────────────────────
function buildStrengthsWeaknesses(
  details: { clarityScore: number; stabilityScore: number; sufficiencyScore: number; predictabilityScore: number },
  a: ReturnType<typeof analyze>
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (details.clarityScore >= 20) strengths.push('요청 의도가 명확하게 전달됩니다')
  else if (details.clarityScore <= 10) weaknesses.push('요청 의도가 불분명합니다')

  if (details.stabilityScore >= 18) strengths.push('해석 범위가 좁아 결과 예측이 가능합니다')
  else if (details.stabilityScore <= 8) weaknesses.push('표현이 모호해 다양한 방향으로 해석될 수 있습니다')

  if (details.sufficiencyScore >= 18) strengths.push('충분한 정보와 맥락이 포함되어 있습니다')
  else if (details.sufficiencyScore <= 8) weaknesses.push('정보가 부족해 AI가 임의로 내용을 채울 수 있습니다')

  if (details.predictabilityScore >= 18) strengths.push('출력 형식이 명확해 원하는 결과를 얻기 쉽습니다')
  else if (details.predictabilityScore <= 8) weaknesses.push('출력 형식 미지정으로 결과물이 매번 달라질 수 있습니다')

  if (a.wordCount >= 20) strengths.push('충분한 분량으로 맥락이 잘 전달됩니다')
  if (a.hasPurpose) strengths.push('목적이 명시되어 있습니다')
  if (a.abstractWords.length >= 3) weaknesses.push('추상적 표현이 많아 결과가 불일치할 수 있습니다')

  while (strengths.length < 2) strengths.push(
    strengths.length === 0 ? '기본적인 요청 구조를 갖추고 있습니다' : '이해하기 어렵지 않은 문장입니다'
  )
  while (weaknesses.length < 2) weaknesses.push(
    weaknesses.length === 0 ? '더 구체적인 맥락을 추가하면 좋겠습니다' : '출력 형식을 지정해보세요'
  )

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) }
}

// ─── 메인 평가 함수 ───────────────────────────────────────────────
export function evaluatePrompt(prompt: string, topic: string): EvaluationResult {
  if (isInvalidPrompt(prompt)) {
    return {
      promptScore: 0,
      feedback: '유효하지 않은 입력입니다. 5자 이상의 의미 있는 프롬프트를 작성해 주세요.',
      promptDetails: { clarityScore: 0, stabilityScore: 0, sufficiencyScore: 0, predictabilityScore: 0 },
      strengths: ['프롬프트 작성에 도전해보세요', '기본 아이디어를 정리해보세요'],
      weaknesses: ['5자 이상의 의미 있는 문장을 작성해주세요', '구체적인 주제를 포함해주세요'],
    }
  }

  const promptEval = scorePromptQuality(prompt)
  const a = analyze(prompt)
  const sw = buildStrengthsWeaknesses(promptEval.details, a)
  const feedback = buildFeedback(prompt, promptEval.total, promptEval.details)

  return {
    promptScore: Math.min(100, Math.max(0, promptEval.total)),
    feedback,
    promptDetails: promptEval.details,
    strengths: sw.strengths,
    weaknesses: sw.weaknesses,
  }
}
