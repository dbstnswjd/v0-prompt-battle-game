// ─── 타입 정의 ───────────────────────────────────────────────────
interface EvaluationResult {
  ideaScore: number
  promptScore: number
  feedback: string
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

// ─── NLP 심층 분석 ────────────────────────────────────────────────
function analyze(text: string) {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 0)

  // 단어 빈도 및 중복률
  const wordFreq: Record<string, number> = {}
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })
  const uniqueWords = Object.keys(wordFreq).length
  const duplicateWords = Object.values(wordFreq).filter(c => c > 1).reduce((a, b) => a + b, 0)
  const dupRate = words.length > 0 ? duplicateWords / words.length : 0
  const ttr = words.length > 0 ? uniqueWords / words.length : 0

  // 형태소 추정 (한국어 기반)
  const nouns = text.match(/[가-힣]{2,}(?:이|가|을|를|의|에|에서|로|으로|와|과|도|는|은)/g) || []
  const verbs = text.match(/(?:해|해줘|알려|설명|분석|작성|생성|만들|제시|요약|정리|구현|설계|추천)/g) || []
  const adjectives = text.match(/(?:구체적|자세|상세|명확|정확|간결|효율|최적|핵심|전문|빠른|좋은|나쁜)/g) || []

  // 분석 지표
  const hasNumber = /\d+/.test(text)
  const hasProperNoun = /[A-Z][a-z]+|[가-힣]{2,}(?:기업|회사|서비스|플랫폼|앱|시스템)/.test(text)
  const hasTechnicalTerm = /AI|API|UX|UI|DB|SaaS|B2B|B2C|MVP|KPI|ROI|머신러닝|딥러닝|알고리즘|아키텍처/.test(text)
  const hasPurpose = /위해|목적|원한다|하려고|하기 위|을 위한|를 위한|필요|원하는/.test(text)
  const hasCondition = /만약|조건|경우|상황|때는|이라면|다면|~하면/.test(text)
  const hasOutputFormat = /표|목록|단계|번호|형식|포맷|정리|요약|예시|샘플|리스트/.test(text)
  const hasTarget = /사용자|고객|대상|타겟|팀|개발자|기획자|마케터|학생|초보|전문가/.test(text)
  const isQuestion = /[?？]/.test(text) || /알려줘|설명해|말해줘|알고 싶|궁금|어떻게|무엇/.test(text)

  // 연결어 분석
  const causeConnectors = ['때문에', '따라서', '그러므로', '결과적으로', '이로 인해']
  const contrastConnectors = ['하지만', '그러나', '반면', '반대로', '대신']
  const addConnectors = ['그리고', '또한', '게다가', '뿐만 아니라', '추가로']
  const condConnectors = ['만약', '~라면', '경우에는', '조건으로']

  const causeCount = causeConnectors.filter(c => text.includes(c)).length
  const contrastCount = contrastConnectors.filter(c => text.includes(c)).length
  const addCount = addConnectors.filter(c => text.includes(c)).length
  const condCount = condConnectors.filter(c => text.includes(c)).length
  const connectorCount = causeCount + contrastCount + addCount + condCount

  // 추상어 분석
  const abstractWords = text.match(/(?:좋은|나쁜|잘|많이|빠르게|효율적|최대한|가능하면|적당히|잘 되게|멋지게)/g) || []

  return {
    words, wordCount: words.length, charCount: text.length,
    sentences, sentenceCount: sentences.length,
    avgSentenceLen: words.length / Math.max(1, sentences.length),
    uniqueWords, ttr, dupRate,
    nouns, verbs, adjectives,
    hasNumber, hasProperNoun, hasTechnicalTerm,
    hasPurpose, hasCondition, hasOutputFormat, hasTarget, isQuestion,
    causeCount, contrastCount, addCount, condCount, connectorCount,
    abstractWords,
  }
}

// ─── 프롬프트 점수 ────────────────────────────────────────────────
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
  if (a.nouns.length >= 1) structureScore += 5
  if (a.verbs.length >= 1) structureScore += 5
  if (a.sentenceCount >= 2) structureScore += 5

  // B. 길이 적절성 (0~10)
  let lengthScore = 0
  if (a.wordCount >= 10) lengthScore += 5
  if (a.charCount >= 30 && a.charCount <= 300) lengthScore += 5
  if (a.charCount > 300) lengthScore -= 5

  // C. 구체성 (0~20)
  let specificityScore = 0
  if (a.hasNumber) specificityScore += 5
  if (a.hasPurpose) specificityScore += 5
  if (a.hasCondition) specificityScore += 5
  if (a.hasOutputFormat) specificityScore += 5

  // D. 논리 연결성 (0~15)
  const logicScore = Math.min(15, a.connectorCount * 3)

  // E. 반복 감점 (-10~0)
  let repetitionPenalty = 0
  if (a.dupRate > 0.3) repetitionPenalty = -10
  else if (a.dupRate > 0.2) repetitionPenalty = -5

  // F. 추상도 보정 (-5~+10)
  let abstractBalance = 0
  if (a.abstractWords.length >= 3 && a.nouns.length < 2) abstractBalance = -5
  if (a.nouns.length >= 5) abstractBalance = 10

  const total = Math.min(100, Math.max(0,
    base + structureScore + lengthScore + specificityScore + logicScore + repetitionPenalty + abstractBalance
  ))

  return {
    total: Math.round(total),
    details: { structureScore, lengthScore, specificityScore, logicScore, repetitionPenalty }
  }
}

// ─── 아이디어 점수 ────────────────────────────────────────────────
function scoreIdea(prompt: string, topic: string) {
  if (isInvalidPrompt(prompt)) {
    return {
      total: 0,
      details: { creativity: 0, feasibility: 0, specificity: 0, marketability: 0, trendAlignment: 0 }
    }
  }

  let creativity = 55, feasibility = 55, specificity = 55, marketability = 55, trendAlignment = 55

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

// ─── PRD v4 초정밀 총평 생성 ──────────────────────────────────────
function buildFeedback(
  prompt: string,
  ideaScore: number,
  promptScore: number,
  ideaDetails: ReturnType<typeof scoreIdea>['details'],
  promptDetails: ReturnType<typeof scorePromptQuality>['details'],
): string {
  const a = analyze(prompt)
  const totalScore = Math.round((ideaScore + promptScore) / 2)
  const sections: string[] = []

  // [1] 전반적 품질 진단
  let quality = ''
  if (totalScore >= 85) {
    quality = `전반적으로 해당 프롬프트는 높은 수준의 완성도를 보입니다. 총 ${totalScore}점으로 구조적 명확성과 아이디어 품질이 고루 우수합니다.`
  } else if (totalScore >= 70) {
    quality = `전반적으로 해당 프롬프트는 기본 요건을 충족하나 일부 보완이 필요한 상태입니다. 총 ${totalScore}점으로 아이디어는 유효하지만 프롬프트 구조에서 개선 여지가 확인됩니다.`
  } else if (totalScore >= 55) {
    quality = `전반적으로 해당 프롬프트는 기본적인 의도는 전달되나 구체성과 전략성이 부족한 상태입니다. 총 ${totalScore}점으로 핵심 요소들이 명확히 정의되지 않아 완성도가 제한됩니다.`
  } else {
    quality = `전반적으로 해당 프롬프트는 구조와 내용 모두 개선이 필요한 초기 단계입니다. 총 ${totalScore}점으로 목적, 대상, 조건 등 핵심 요소가 대부분 누락된 상태입니다.`
  }
  sections.push(quality)

  // [2] 구조적 분석
  const sentenceDesc = a.sentenceCount === 1 ? '단일 문장' : `${a.sentenceCount}개의 문장`
  const lenDesc = a.charCount < 30 ? '매우 짧은' : a.charCount < 80 ? '단문' : a.charCount < 200 ? '적절한 길이의' : '장문'
  const nounDesc = a.nouns.length === 0 ? '명확한 명사 구조 없이' : `${a.nouns.length}개의 명사 구조가`
  const verbDesc = a.verbs.length === 0 ? '동사 표현이 확인되지 않으며' : `동사 ${a.verbs.length}개가 포함되어`
  sections.push(
    `구조적으로 살펴보면, 입력 문장은 ${sentenceDesc}으로 구성된 ${lenDesc} 텍스트입니다. ${nounDesc} 포함되어 있고, ${verbDesc}, 평균 문장 길이는 ${Math.round(a.avgSentenceLen)}단어 수준입니다. ${a.sentenceCount < 2 ? '복문 구조나 조건 표현은 나타나지 않습니다.' : '복문 구조가 활용되어 기본적인 문장 완성도는 확보되었습니다.'}`
  )

  // [3] 어휘 다양성 분석
  const ttrLevel = a.ttr >= 0.8 ? '높음' : a.ttr >= 0.6 ? '보통' : '낮음'
  const absDesc = a.abstractWords.length >= 3
    ? `"${a.abstractWords.slice(0, 2).join('", "')}"와 같은 추상적 표현이 주를 이루어`
    : '추상어 사용은 제한적이며'
  sections.push(
    `어휘 다양성은 TTR 기준 ${a.ttr.toFixed(2)} 수준으로 ${ttrLevel} 범위에 해당합니다. 전체 ${a.wordCount}개 단어 중 고유 단어는 ${a.uniqueWords}개이며, 중복률은 ${Math.round(a.dupRate * 100)}%입니다. ${absDesc} 정보 밀도는 ${a.abstractWords.length >= 3 ? '낮은 편' : '적절한 수준'}입니다.`
  )

  // [4] 구체성 및 정보 밀도
  const specifics: string[] = []
  if (!a.hasNumber) specifics.push('정량적 수치 미포함')
  if (!a.hasProperNoun) specifics.push('고유명사 미포함')
  if (!a.hasTechnicalTerm) specifics.push('전문 용어 미포함')
  const concDesc = specifics.length === 0
    ? '수치, 고유명사, 전문 용어가 고루 활용되어 구체성이 높습니다.'
    : `${specifics.join(', ')} 등의 요소가 누락되어 구체성 점수에 영향을 미쳤습니다.`
  sections.push(
    `구체성 측면에서는 ${concDesc} ${a.hasTarget ? '대상 사용자가 명시되어 있어 수요 정의가 명확합니다.' : '타겟 사용자나 대상 범위가 정의되지 않아 해석의 폭이 지나치게 넓습니다.'}`
  )

  // [5] 논리 전개 및 흐름
  const logicParts: string[] = []
  if (a.causeCount > 0) logicParts.push(`인과 표현 ${a.causeCount}건`)
  if (a.contrastCount > 0) logicParts.push(`대조 표현 ${a.contrastCount}건`)
  if (a.addCount > 0) logicParts.push(`첨가 표현 ${a.addCount}건`)
  if (a.condCount > 0) logicParts.push(`조건 표현 ${a.condCount}건`)
  const logicDesc = logicParts.length > 0
    ? `논리 연결어 총 ${a.connectorCount}회(${logicParts.join(', ')})가 사용되어 문장 간 흐름이 구성되어 있습니다.`
    : '인과, 대조, 조건 등의 논리 연결 표현이 사용되지 않아 논리 전개는 단선적입니다.'
  sections.push(logicDesc)

  // [6] 전략적 완성도
  const stratOk: string[] = []
  const stratMiss: string[] = []
  if (a.hasPurpose) stratOk.push('목적 명시') ; else stratMiss.push('목적')
  if (a.hasTarget) stratOk.push('대상 정의') ; else stratMiss.push('대상')
  if (a.hasOutputFormat) stratOk.push('출력 형식') ; else stratMiss.push('출력 형식')
  if (a.hasCondition) stratOk.push('조건 설정') ; else stratMiss.push('조건')
  const stratDesc = stratMiss.length === 0
    ? `목적, 대상, 출력 형식, 조건이 모두 정의되어 전략적 완성도가 높습니다.`
    : `전략적 요소 중 ${stratOk.length > 0 ? stratOk.join(', ') + '는 충족되었으나, ' : ''}${stratMiss.join(', ')}이(가) 명시되지 않아 전략적 완성도가 제한됩니다.`
  sections.push(stratDesc)

  // [7] 개선 방향 (행동 기반)
  const improvements: string[] = []
  if (!a.hasNumber) improvements.push('구체적인 수치나 조건을 1~2개 이상 추가하세요')
  if (!a.hasPurpose) improvements.push('프롬프트의 목적과 활용 맥락을 명시하세요')
  if (!a.hasTarget) improvements.push('타겟 사용자 또는 적용 대상을 구체적으로 정의하세요')
  if (!a.hasOutputFormat) improvements.push('원하는 출력 형식(목록, 단계별, 표 등)을 명시하세요')
  if (a.connectorCount === 0) improvements.push('인과 관계나 조건 구조를 활용해 논리 흐름을 강화하세요')
  if (a.wordCount < 15) improvements.push('프롬프트를 최소 2~3문장 이상으로 확장해 정보 밀도를 높이세요')
  if (improvements.length === 0) improvements.push('현재 구조를 유지하되, 예외 케이스나 심화 조건을 추가해 완성도를 더 높일 수 있습니다')

  const improvStr = improvements.slice(0, 3).map((imp, i) => `${i + 1}. ${imp}`).join(' ')
  sections.push(`개선을 위해서는 다음을 권장합니다. ${improvStr}.`)

  return sections.join('\n\n')
}

// ─── 강점 / 약점 생성 ─────────────────────────────────────────────
function buildStrengthsWeaknesses(
  ideaDetails: ReturnType<typeof scoreIdea>['details'],
  promptDetails: ReturnType<typeof scorePromptQuality>['details'],
  prompt: string,
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (ideaDetails.creativity >= 70) strengths.push('창의적이고 독창적인 아이디어 접근')
  else if (ideaDetails.creativity < 50) weaknesses.push('아이디어의 독창성이 부족합니다')

  if (ideaDetails.feasibility >= 70) strengths.push('실현 가능성이 높은 현실적 제안')
  else if (ideaDetails.feasibility < 50) weaknesses.push('실행 가능성을 높이는 구체적 방안 필요')

  if (ideaDetails.specificity >= 70) strengths.push('구체적이고 명확한 문제 정의')
  else if (ideaDetails.specificity < 50) weaknesses.push('주제에 대한 구체성과 세부 사항 보완 필요')

  if (ideaDetails.marketability >= 70) strengths.push('시장 수요와의 관련성이 높음')
  else if (ideaDetails.marketability < 50) weaknesses.push('시장 수요와 관련성을 높이는 방안 필요')

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

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) }
}

// ─── 메인 평가 함수 ───────────────────────────────────────────────
export function evaluatePrompt(prompt: string, topic: string): EvaluationResult {
  if (isInvalidPrompt(prompt)) {
    return {
      ideaScore: 0, promptScore: 0,
      feedback: '유효하지 않은 입력입니다. 5자 이상의 의미 있는 프롬프트를 작성해 주세요.',
      ideaDetails: { creativity: 0, feasibility: 0, specificity: 0, marketability: 0, trendAlignment: 0 },
      promptDetails: { structureScore: 0, lengthScore: 0, specificityScore: 0, logicScore: 0, repetitionPenalty: 0 },
      strengths: ['프롬프트 작성에 도전해보세요', '기본 아이디어를 정리해보세요'],
      weaknesses: ['5자 이상의 의미 있는 문장을 작성해주세요', '구체적인 주제를 포함해주세요'],
    }
  }

  const ideaEval = scoreIdea(prompt, topic)
  const promptEval = scorePromptQuality(prompt)
  const sw = buildStrengthsWeaknesses(ideaEval.details, promptEval.details, prompt)
  const feedback = buildFeedback(prompt, ideaEval.total, promptEval.total, ideaEval.details, promptEval.details)

  return {
    ideaScore: Math.min(100, Math.max(0, ideaEval.total)),
    promptScore: Math.min(100, Math.max(0, promptEval.total)),
    feedback,
    ideaDetails: ideaEval.details,
    promptDetails: promptEval.details,
    strengths: sw.strengths,
    weaknesses: sw.weaknesses,
  }
}
