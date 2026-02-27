
// ─── 타입 ─────────────────────────────────────────────────────────
interface PromptDetails {
  reqClarity: number       // ① 요구 명확도 0–15
  infoSufficiency: number  // ② 정보 충분성 0–20 (타겟 사용자 E항목 추가)
  funcSpec: number         // ③ 기능 명세 완성도 0–15 (NEW)
  specificity: number      // ④ 구체성 수준 0–15
  interpStability: number  // ⑤ 해석 안정성 0–10
  executability: number    // ⑥ 실행 가능성 0–15
  structureOrg: number     // ⑦ 구조 조직력 0–10
  intentConsist: number    // ⑧ 의도 일관성 0–10
  bonus: number            // ⑨ 보정치 −5~+10
}

interface EvaluationResult {
  promptScore: number
  feedback: string
  promptDetails: PromptDetails
  strengths: string[]
  weaknesses: string[]
}

// ─── Hard filter ──────────────────────────────────────────────────
function isInvalidPrompt(text: string): boolean {
  const t = text.trim()
  if (t.length < 5) return true
  if (/^[^가-힣a-zA-Z0-9]+$/.test(t)) return true
  if (/(.)\1{4,}/.test(t)) return true
  if (/^(asdf|qwer|zxcv|1234|ㅁㄴㅇㄹ|ㅂㅈㄷㄱ)/i.test(t)) return true
  return false
}

// ─── 텍스트 분석 ──────────────────────────────────────────────────
function analyze(text: string) {
  const words = text.split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 2)

  // 어휘 다양성
  const freq: Record<string, number> = {}
  words.forEach(w => { freq[w.toLowerCase()] = (freq[w.toLowerCase()] || 0) + 1 })
  const uniqueCount = Object.keys(freq).length
  const dupRate = words.length > 0 ? Object.values(freq).filter(c => c > 1).reduce((a, b) => a + b, 0) / words.length : 0

  // 행동 동사 (명확)
  const clearVerbs = (text.match(/(?:작성|분석|비교|생성|만들|설계|구현|요약|정리|추천|설명|조사|평가|기획|작성해|분석해|비교해)/g) || [])
  // 추상 동사
  const abstractVerbs = (text.match(/(?:해줘|알아서|해|적당히|잘|좀)/g) || [])

  // 모호 표현
  const vagueWords = (text.match(/(?:요즘 느낌|적당히|많이|다양하게|좋은|잘|빠르게|효율적으로|최대한|가능하면|멋지게|깔끔하게|간단하게)/g) || [])

  // 정량 요소
  const numbers = (text.match(/\d+/g) || [])
  const quantifiers = (text.match(/(?:\d+개|\d+단계|\d+가지|\d+줄|\d+자|\d+페이지|\d+개월|\d+명)/g) || [])

  // 출력 형식 지정
  const outputFormats = (text.match(/(?:표|목록|리스트|단계별|번호|JSON|마크다운|문단|항목|예시|샘플|형식|포맷|bullet)/gi) || [])

  // 역할 지정
  const hasRole = /(?:전문가|개발자|기획자|마케터|디자이너|교사|컨설턴트|당신은|역할|as a|act as)/i.test(text)

  // 맥락/목적
  const hasPurpose = /(?:위해|목적|원한다|하려고|하기 위|을 위한|를 위한|필요|원하는|사용할|활용할)/i.test(text)
  const hasBackground = /(?:상황|배경|현재|우리|회사|서비스|플랫폼|프로젝트)/i.test(text)

  // 대상
  const hasTarget = /(?:사용자|고객|대상|타겟|팀|개발자|기획자|마케터|학생|초보|전문가|B2B|B2C)/i.test(text)
  const hasDomain = /(?:AI|SaaS|앱|플랫폼|서비스|시스템|기업|스타트업|마케팅|교육|의료|금융)/i.test(text)

  // 타겟 사용자 정의 (E항목)
  const hasTargetUserWho = /(?:누구|사용자|타겟|대상|고객층|유저|이용자|사용할 사람|쓸 사람|위한)/i.test(text)
  const hasTargetAge = /(?:\d+대|청소년|어린이|노인|시니어|MZ|2030|3040|중장년|초등|중등|고등|대학)/i.test(text)
  const hasTargetPurpose = /(?:목적|용도|원해서|하려고|활용|위해|사용하려|쓰려고|할 때|상황에서)/i.test(text)
  const hasTargetContext = /(?:상황|환경|현장|업무|일상|학습|출근|퇴근|운동|쇼핑|여행|비즈니스)/i.test(text)

  // 기능 명세 (③ 기능 명세 완성도)
  const hasFuncName = /(?:기능|모듈|메뉴|화면|페이지|버튼|탭|섹션|서비스|피처|feature)/i.test(text)
  const hasFuncPurpose = /(?:할 수 있|가능하게|제공|지원|처리|관리|보여|표시|저장|전송|알림|분석)/i.test(text)
  const hasUserAction = /(?:선택|입력|클릭|스크롤|탭|필터|검색|업로드|다운로드|설정|조회|등록|삭제|수정)/i.test(text)
  const hasSystemResponse = /(?:보여줍니다|표시합니다|저장됩니다|전송됩니다|생성됩니다|알림|업데이트|반영)/i.test(text)
  const hasDataFlow = /(?:기록.*저장|저장.*시각화|입력.*분석|데이터.*흐름|전송.*처리|추천.*로직|통계)/i.test(text)
  const hasFuncDecomp = /(?:하위|세부|단위|구성|요소|컴포넌트|모듈|기능.*목록|목록.*기능)/i.test(text)

  // 조건/제약
  const hasCondition = /(?:만약|조건|경우|상황|때는|이라면|다면|단,|주의|제외|제한)/i.test(text)
  const hasConstraint = /(?:금지|사용하지|포함하지|제외|피해|하지 마)/i.test(text)

  // 논리 연결어
  const logicConnectors = ['따라서', '그러므로', '결과적으로', '이로 인해', '때문에', '하지만', '반면', '그러나', '반대로', '또한', '뿐만 아니라', '게다가', '첫째', '둘째', '셋째', '마지막으로']
  const connectorCount = logicConnectors.filter(c => text.includes(c)).length

  // 단계/순서
  const hasSteps = /(?:단계|순서|먼저|다음|마지막|1\.|2\.|3\.|첫째|둘째|셋째)/i.test(text)

  // 줄바꿈 / bullet
  const hasLineBreaks = (text.match(/\n/g) || []).length >= 2
  const hasBullet = /(?:^[-•*]|\n[-•*])/m.test(text)

  // 성공 기준
  const hasSuccessCriteria = /(?:기준|수준|조건|성공|품질|점수|만족|달성)/i.test(text)

  // 충돌 탐지
  const toneConflict = /(?:친근하게.*공식적으로|전문적으로.*쉽게|간단하게.*자세하게|짧게.*길게)/i.test(text)
  const scopeConflict = /(?:전부.*간단히|모두.*짧게|모든.*요약)/i.test(text)

  // 과도한 장황함
  const isOverlyVerbose = words.length > 150
  const hasDuplicateInstructions = dupRate > 0.35

  return {
    words, wordCount: words.length, charCount: text.length,
    sentences, sentenceCount: sentences.length,
    uniqueCount, dupRate,
    clearVerbs, abstractVerbs, vagueWords,
    numbers, quantifiers, outputFormats,
    hasRole, hasPurpose, hasBackground,
    hasTarget, hasDomain,
    hasTargetUserWho, hasTargetAge, hasTargetPurpose, hasTargetContext,
    hasFuncName, hasFuncPurpose, hasUserAction, hasSystemResponse, hasDataFlow, hasFuncDecomp,
    hasCondition, hasConstraint,
    connectorCount, hasSteps,
    hasLineBreaks, hasBullet,
    hasSuccessCriteria,
    toneConflict, scopeConflict,
    isOverlyVerbose, hasDuplicateInstructions,
  }
}

// ─── 9개 항목 채점 ────────────────────────────────────────────────
function scoreAll(text: string): { details: PromptDetails; raw: number } {
  const a = analyze(text)

  // ① 요구 명확도 (0–15)
  let reqClarity = 0
  // A. 작업 동사 명시성 (0–4)
  if (a.clearVerbs.length >= 1) reqClarity += 3
  else if (a.abstractVerbs.length === 0) reqClarity += 1
  if (a.abstractVerbs.length >= 2) reqClarity -= 1
  // B. 목표 정의 수준 (0–4)
  if (a.hasPurpose) reqClarity += 3
  if (a.hasSuccessCriteria) reqClarity += 1
  // C. 작업 범위 경계 (0–4)
  if (a.hasConstraint || a.hasCondition) reqClarity += 2
  if (a.wordCount >= 15) reqClarity += 1
  // D. 모호 표현 밀도 (0–3)
  reqClarity += Math.max(0, 3 - a.vagueWords.length)
  reqClarity = Math.max(0, Math.min(15, reqClarity))

  // ② 정보 충분성 — 강화판 (0–20)
  let infoSufficiency = 0
  // A. 대상 정의 (0–3)
  if (a.hasTarget) infoSufficiency += 2
  if (a.hasDomain) infoSufficiency += 1
  // B. 맥락 제공 (0–4)
  if (a.hasPurpose) infoSufficiency += 2
  if (a.hasBackground) infoSufficiency += 2
  // C. 입력 데이터 / 예시 (0–3)
  if (a.numbers.length >= 1) infoSufficiency += 1
  if (a.wordCount >= 20) infoSufficiency += 1
  if (a.wordCount >= 40) infoSufficiency += 1
  // D. 조건 명시 (0–3)
  if (a.hasCondition) infoSufficiency += 2
  if (a.hasConstraint) infoSufficiency += 1
  // E. 타겟 사용자 정의 (0–7) — NEW, 매우 중요
  if (a.hasTargetUserWho) infoSufficiency += 2   // 누구를 위한 앱인지
  if (a.hasTargetAge) infoSufficiency += 2        // 연령대/직군
  if (a.hasTargetPurpose) infoSufficiency += 2    // 목적/용도
  if (a.hasTargetContext) infoSufficiency += 1    // 사용 상황/환경
  if (a.hasDuplicateInstructions) infoSufficiency = Math.max(0, infoSufficiency - 2)
  infoSufficiency = Math.max(0, Math.min(20, infoSufficiency))

  // ③ 기능 명세 완성도 (0–15) — NEW
  let funcSpec = 0
  // A. 기능 정의 명확성 (0–4)
  if (a.hasFuncName) funcSpec += 2
  if (a.hasFuncPurpose) funcSpec += 2
  // B. 기능 단위 분해도 (0–4)
  if (a.hasFuncDecomp) funcSpec += 2
  if (a.hasUserAction) funcSpec += 2
  // C. 사용자 인터랙션 명시성 (0–4) — 실무 차별화 포인트
  if (a.hasUserAction && a.hasSystemResponse) funcSpec += 3  // 양방향 흐름
  else if (a.hasUserAction || a.hasSystemResponse) funcSpec += 1
  // D. 데이터 흐름 암시 (0–3)
  if (a.hasDataFlow) funcSpec += 3
  funcSpec = Math.max(0, Math.min(15, funcSpec))

  // ④ 구체성 수준 (0–15)
  let specificity = 0
  specificity += Math.min(5, a.quantifiers.length * 2 + (a.numbers.length >= 1 ? 1 : 0))
  if (a.hasSteps) specificity += 2
  if (a.hasBullet) specificity += 2
  specificity += Math.max(0, 3 - a.vagueWords.length)
  specificity += Math.min(3, a.outputFormats.length)
  if (a.hasDuplicateInstructions) specificity = Math.max(0, specificity - 1)
  specificity = Math.max(0, Math.min(15, specificity))

  // ⑤ 해석 안정성 (0–10)
  let interpStability = 5
  interpStability -= Math.min(3, a.vagueWords.length)
  if (a.hasCondition) interpStability += 2
  if (a.hasConstraint) interpStability += 1
  if (a.toneConflict) interpStability -= 2
  if (a.scopeConflict) interpStability -= 2
  interpStability = Math.max(0, Math.min(10, interpStability))

  // ⑥ 실행 가능성 (0–15)
  let executability = 0
  executability += Math.min(4, a.clearVerbs.length * 2)
  if (a.hasSteps) executability += 3
  if (a.connectorCount >= 2) executability += 1
  executability += Math.min(4, a.outputFormats.length * 2)
  if (!a.isOverlyVerbose && a.wordCount >= 8) executability += 2
  if (a.wordCount >= 15) executability += 1
  if (a.isOverlyVerbose) executability -= 2
  executability = Math.max(0, Math.min(15, executability))

  // ⑦ 구조 조직력 (0–10)
  let structureOrg = 3
  if (a.sentenceCount >= 2) structureOrg += 2
  structureOrg += Math.min(3, a.connectorCount)
  if (a.hasLineBreaks) structureOrg += 1
  if (a.hasBullet) structureOrg += 1
  structureOrg = Math.max(0, Math.min(10, structureOrg))

  // ⑧ 의도 일관성 (0–10)
  let intentConsist = 8
  if (a.toneConflict) intentConsist -= 3
  if (a.scopeConflict) intentConsist -= 3
  if (a.hasDuplicateInstructions) intentConsist -= 2
  intentConsist = Math.max(0, Math.min(10, intentConsist))

  // ⑨ 보정치 (−5~+10)
  let bonus = 0
  if (a.outputFormats.length >= 1) bonus += 2
  if (a.hasRole) bonus += 2
  if (a.hasSteps) bonus += 2
  if (a.hasConstraint) bonus += 1
  if (a.hasSuccessCriteria) bonus += 2
  if (a.hasTargetUserWho && a.hasTargetPurpose) bonus += 1  // 타겟+목적 동시 만족
  if (a.hasUserAction && a.hasSystemResponse) bonus += 1    // 인터랙션 양방향
  if (a.isOverlyVerbose) bonus -= 2
  if (a.hasDuplicateInstructions) bonus -= 2
  if (a.vagueWords.length >= 4) bonus -= 1
  bonus = Math.max(-5, Math.min(10, bonus))

  // raw max = 15+20+15+15+10+15+10+10+10 = 120
  const raw = reqClarity + infoSufficiency + funcSpec + specificity + interpStability + executability + structureOrg + intentConsist + bonus

  return {
    details: { reqClarity, infoSufficiency, funcSpec, specificity, interpStability, executability, structureOrg, intentConsist, bonus },
    raw,
  }
}

// ─── 최종 점수 계산 ───────────────────────────────────────────────
// raw max = 15+20+15+15+10+15+10+10+10 = 120
// 기준치 = 50 (중간 프롬프트 평균 raw 값)
// final = clamp(50 + (raw - 50), 0, 100)
function calcFinalScore(raw: number): number {
  return Math.max(0, Math.min(100, 50 + (raw - 50)))
}

// ─── Adaptive Feedback Engine v1 ──────────────────────────────────

type ProblemType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

function classifyTypes(d: PromptDetails, a: ReturnType<typeof analyze>): ProblemType[] {
  const types: { type: ProblemType; weight: number }[] = []

  // TYPE_A: 목적 불명확형
  if (d.reqClarity <= 6 && !a.hasPurpose) types.push({ type: 'A', weight: 3 })
  else if (d.reqClarity <= 9) types.push({ type: 'A', weight: 1 })

  // TYPE_B: 기능 부족형
  if (d.funcSpec <= 4 && !a.hasFuncName) types.push({ type: 'B', weight: 3 })
  else if (d.funcSpec <= 8) types.push({ type: 'B', weight: 1 })

  // TYPE_C: 맥락 부족형 (타겟 사용자 포함)
  if (!a.hasTargetUserWho && d.infoSufficiency <= 8) types.push({ type: 'C', weight: 3 })
  else if (d.infoSufficiency <= 12) types.push({ type: 'C', weight: 1 })

  // TYPE_D: 과도한 모호 표현형
  if (a.vagueWords.length >= 3 && d.interpStability <= 5) types.push({ type: 'D', weight: 2 })
  else if (a.vagueWords.length >= 2) types.push({ type: 'D', weight: 1 })

  // TYPE_E: 구조 미흡형
  if (d.structureOrg <= 3 && d.executability <= 5) types.push({ type: 'E', weight: 2 })

  // TYPE_F: 거의 완성형
  if (d.reqClarity >= 11 && d.infoSufficiency >= 14 && d.funcSpec >= 10) types.push({ type: 'F', weight: 3 })

  // TYPE_G: 충돌/모순 포함형
  if (a.toneConflict || a.scopeConflict || a.hasDuplicateInstructions) types.push({ type: 'G', weight: 3 })

  types.sort((x, y) => y.weight - x.weight)
  const primary = types[0]?.type
  const secondaries = types.slice(1, 3).map(t => t.type)
  return primary ? [primary, ...secondaries] : ['A']
}

function buildFeedback(
  text: string,
  score: number,
  d: PromptDetails
): string {
  const a = analyze(text)
  const types = classifyTypes(d, a)
  const primary = types[0]
  const parts: string[] = []

  // ── 1단계: 한 줄 진단 (매번 다른 표현, 프롬프트 유형별 맞춤) ──
  const diagnosisMap: Record<ProblemType, string[]> = {
    A: [
      '요청의 방향은 감지되지만 AI가 목적을 확신하기 어려운 구조입니다.',
      '무엇을 원하는지 알 것 같으면서도, AI가 해석을 스스로 완성해야 하는 프롬프트입니다.',
      '의도가 흐릿하게 전달됩니다. AI가 추측해서 채워야 할 빈칸이 많습니다.',
    ],
    B: [
      '기능 구상은 느껴지지만, AI가 실제로 설계하기엔 정보가 부족합니다.',
      '만들고 싶은 것은 있는데, 무엇을 어떻게 만들어야 하는지 AI에게 전달되지 않았습니다.',
      '기능 목록이 있어도 인터랙션 흐름 없이는 AI가 껍데기 수준의 결과만 냅니다.',
    ],
    C: [
      '누구를 위한 것인지, 어떤 상황에서 쓰이는지가 빠져 있습니다.',
      '배경이 없으면 AI는 가장 평범한 가정으로 채웁니다. 지금 이 프롬프트가 그 상태입니다.',
      '타겟과 맥락이 없으면 AI 출력은 가장 일반적인 방향으로 흐릅니다.',
    ],
    D: [
      `"${a.vagueWords.slice(0, 2).join('", "')}" 같은 표현이 프롬프트의 해석 범위를 넓혀놓고 있습니다.`,
      '표현 자체는 자연스럽지만, AI가 기준을 잡기 어려운 단어들이 섞여 있습니다.',
      '모호한 수식어가 많을수록 AI 출력은 매번 다른 방향으로 수렴합니다.',
    ],
    E: [
      '요청 내용이 하나의 덩어리로 뭉쳐 있어 AI가 우선순위를 잡기 어렵습니다.',
      '구조 없이 나열된 요구사항은 AI가 순서대로 처리하지 않을 수 있습니다.',
      '읽기 어렵지는 않지만, AI가 어디서 시작해 어디서 끝내야 할지 불분명합니다.',
    ],
    F: [
      '프롬프트 설계 측면에서 높은 완성도를 보입니다.',
      '구조, 맥락, 지시가 잘 갖춰진 프롬프트입니다.',
      '대부분의 요소가 제자리에 있습니다. 이 수준이면 AI가 의도에 가깝게 동작합니다.',
    ],
    G: [
      '내부에서 충돌하는 지시가 발견됩니다. AI가 어느 쪽을 따를지 결정하지 못할 수 있습니다.',
      '모순된 요건이 섞여 있어 AI 출력이 일관되지 않을 가능성이 높습니다.',
      '지시들이 서로 다른 방향을 가리키고 있습니다.',
    ],
  }

  const diagOptions = diagnosisMap[primary]
  const diagIndex = (d.reqClarity + d.infoSufficiency) % diagOptions.length
  parts.push(diagOptions[diagIndex])

  // ── 2단계: 문제 유형별 맞춤 분석 (TYPE별 코칭 톤 적용) ──
  const secondPart: string[] = []

  if (primary === 'A' || types.includes('A')) {
    // 방향 제시형 코칭
    if (!a.hasPurpose)
      secondPart.push('이 프롬프트에는 요청의 목적이 빠져 있습니다. "~을 위해", "~상황에서 사용할" 같은 맥락 문장 하나가 AI의 응답 방향을 완전히 바꿉니다.')
    if (a.abstractVerbs.length >= 1)
      secondPart.push(`"${a.abstractVerbs[0]}" 같은 추상적 지시 대신 "작성해줘", "단계별로 설명해줘"처럼 AI가 즉시 실행할 수 있는 동사로 바꿔보세요.`)
  }

  if (primary === 'B' || types.includes('B')) {
    // 방향 제시형 코칭
    if (!a.hasUserAction && !a.hasSystemResponse)
      secondPart.push('사용자가 버튼을 누르면 무슨 일이 생기는지, 어떤 화면이 나오는지, 이 흐름이 없으면 AI는 기능을 나열만 하고 설계하지 않습니다.')
    if (!a.hasDataFlow && a.hasFuncName)
      secondPart.push('기능 이름은 있지만 데이터가 어떻게 흐르는지가 없습니다. "입력하면 저장되고, 저장되면 목록에 표시된다"처럼 한 줄이라도 흐름을 써보세요.')
  }

  if (primary === 'C' || types.includes('C')) {
    // 명확화 유도형
    if (!a.hasTargetUserWho)
      secondPart.push('이 프롬프트에서 가장 크게 빠진 정보는 "누구를 위한 것인가"입니다. 타겟 사용자를 명시하면 AI가 어휘 수준, 기능 우선순위, 설명 방식 모두를 맞춰서 응답합니다.')
    else if (!a.hasTargetAge && !a.hasTargetContext)
      secondPart.push('대상이 누구인지는 언급됐지만, 그들이 어떤 상황에서 어떤 방식으로 쓰는지가 없습니다. 사용 맥락을 한 문장 추가해보세요.')
    if (!a.hasBackground)
      secondPart.push('왜 이것이 필요한지, 어떤 문제를 해결하려는지 배경 한 줄이 있으면 AI가 방향을 추측하지 않아도 됩니다.')
  }

  if (primary === 'D' || types.includes('D')) {
    // 명확화 유도형
    if (a.vagueWords.length >= 2)
      secondPart.push(`"${a.vagueWords.slice(0, 2).join('", "')}" 같은 표현은 사람마다, AI마다 다르게 해석됩니다. 이 단어들을 "3줄 이내", "초등학생도 이해할 수 있는 수준"처럼 측정 가능한 기준으로 바꾸면 결과 일관성이 올라갑니다.`)
  }

  if (primary === 'E' || types.includes('E')) {
    // 구조 개선형
    if (d.structureOrg <= 4)
      secondPart.push('요청, 배경, 조건이 하나의 문장 안에 뒤섞여 있습니다. 이 세 가지를 분리해서 작성하면 AI가 각각을 독립적으로 처리하고 더 정확한 결과를 냅니다.')
    if (!a.hasSteps && d.executability <= 7)
      secondPart.push('복잡한 요청일수록 "먼저 ~ 다음으로 ~ 마지막으로"처럼 단계를 구분해주면 AI가 순서를 지켜서 처리합니다.')
  }

  if (primary === 'F') {
    // 고급 최적화형
    secondPart.push('이 수준의 프롬프트에서 더 나아가려면 예외 상황이나 엣지 케이스를 추가하는 것이 효과적입니다. "만약 ~한 경우에는 ~하게 처리해줘" 형태의 조건을 넣으면 AI 응답의 견고성이 높아집니다.')
    if (!a.hasRole)
      secondPart.push('역할을 지정(예: "당신은 10년 경력의 UX 디자이너입니다")하면 같은 질문이라도 더 전문적인 관점의 응답이 나옵니다.')
  }

  if (primary === 'G' || types.includes('G')) {
    // 충돌 해결형
    if (a.toneConflict)
      secondPart.push('톤과 관련해 충돌하는 표현이 감지됩니다. 예: "전문적으로"와 "쉽게"를 동시에 요구하면 AI가 어느 쪽도 제대로 못 지킵니다. 우선순위를 정해주세요.')
    if (a.scopeConflict)
      secondPart.push('범위와 관련해 충돌이 있습니다. "모두", "전부"와 "간단히", "요약"이 함께 있으면 AI가 임의로 하나를 선택합니다. 명확하게 하나만 선택해보세요.')
    if (a.hasDuplicateInstructions)
      secondPart.push('비슷한 지시가 반복되어 AI가 같은 내용을 여러 번 처리하거나 혼란스러워할 수 있습니다. 중복된 요구를 하나로 통합해보세요.')
  }

  if (secondPart.length > 0) {
    parts.push(secondPart.slice(0, 2).join('\n\n'))
  }

  // ── 3단계: 행동 가능한 개선 방향 (1~2개, 구체적 예시 포함) ──
  const actions: string[] = []

  if (primary !== 'F') {
    if (!a.hasTargetUserWho)
      actions.push('타겟 사용자를 추가하세요. 예: "30대 자영업자를 위한", "앱 개발 경험이 없는 기획자가 사용할"')
    else if (!a.hasTargetContext)
      actions.push('사용 상황을 추가하세요. 예: "출퇴근 중 모바일로 빠르게 확인하는 상황", "주 1회 팀 회의에서 발표 자료로 활용"')

    if (a.outputFormats.length === 0)
      actions.push('출력 형식을 지정하세요. 예: "3단계 bullet로", "표 형식으로", "핵심만 2문장으로"')
    else if (!a.hasUserAction)
      actions.push('인터랙션 흐름을 추가하세요. 예: "사용자가 날짜를 선택하면 → 해당 기간 데이터를 차트로 표시한다"')

    if (a.vagueWords.length >= 2 && !actions.some(a => a.includes('출력 형식')))
      actions.push(`"${a.vagueWords[0]}" 대신 측정 가능한 기준을 사용하세요. 예: "적당히" → "3개 이내로"`)
  } else {
    actions.push('예외 처리 조건을 추가해보세요. 예: "데이터가 없을 경우에는 빈 상태 메시지를 표시한다"')
    actions.push('성공 기준을 명시해보세요. 예: "초등학생이 읽어도 이해할 수 있는 수준", "5분 안에 읽을 수 있는 분량"')
  }

  if (actions.length > 0) {
    parts.push('다음 중 하나만 추가해도 점수가 달라집니다:\n' + actions.slice(0, 2).map(a => `· ${a}`).join('\n'))
  }

  return parts.join('\n\n')
}

  // ② 취약 항목 기반 구체적 지적
  const weakPoints: string[] = []
  if (d.reqClarity <= 6)
    weakPoints.push('행동 동사가 불명확하거나 "해줘", "알아서"와 같은 추상적 지시가 포함되어 있어 AI가 작업의 경계를 스스로 추정해야 합니다.')
  if (d.infoSufficiency <= 8)
    weakPoints.push(
      !a.hasTargetUserWho
        ? '대상 사용자가 명시되지 않았습니다. 누구를 위한 것인지, 어떤 상황에서 사용하는지를 추가하면 AI 출력의 적절성이 크게 높아집니다.'
        : '대상, 배경, 조건 등 작업에 필요한 핵심 맥락이 부족해 AI가 빈 부분을 임의로 채울 가능성이 있습니다.'
    )
  if (d.funcSpec <= 5)
    weakPoints.push('기능 목록이 있더라도 사용자 인터랙션(선택/입력/결과 표시)이나 데이터 흐름이 없으면 AI가 기능을 피상적으로 설명하게 됩니다.')
  if (d.specificity <= 5)
    weakPoints.push('수량, 단계, 출력 형식 등 구체적인 조건이 없어 결과물의 형태가 매번 달라질 수 있습니다.')
  if (d.interpStability <= 4)
    weakPoints.push(a.vagueWords.length >= 2
      ? `"${a.vagueWords.slice(0, 2).join('", "')}" 같은 표현은 해석 기준이 불명확해 AI 출력이 일관되지 않을 수 있습니다.`
      : '표현의 모호성으로 인해 결과 해석 �����향이 여러 갈래로 열려 있습니다.')
  if (d.executability <= 5)
    weakPoints.push('단계적 지시나 출력 요구 사항이 부족해 AI가 어디서 멈춰야 할지, 어떤 형식으로 답해야 할지 판단하기 어렵습니다.')
  if (a.toneConflict || a.scopeConflict)
    weakPoints.push('내부적으로 상충하는 지시가 감지되어 AI가 어느 요건을 우선해야 할지 혼란을 겪을 수 있습니다.')

  if (weakPoints.length > 0) {
    parts.push(weakPoints.slice(0, 2).join(' '))
  }

  // ③ 잘된 부분
  const goodPoints: string[] = []
  if (d.reqClarity >= 11) goodPoints.push('요청 동사와 목표가 명확하게 표현되어 AI가 작업 범위를 즉시 파악할 수 있습니다.')
  if (d.infoSufficiency >= 14) goodPoints.push(
    a.hasTargetUserWho && a.hasTargetPurpose
      ? '대상 사용자, 사용 목적, 맥락이 모두 포함되어 있어 AI가 최적화된 수준으로 출력을 조정할 수 있습니다.'
      : '충분한 맥락과 대상 정보가 포함되어 있어 AI가 방향을 스스로 설정할 필요가 없습니다.'
  )
  if (d.funcSpec >= 10) goodPoints.push('사용자 인터랙션과 데이터 흐름이 명시되어 있어 AI가 실제 개발 가능한 수준으로 기능을 설계할 수 있습니다.')
  if (d.specificity >= 11) goodPoints.push('정량 요소나 출력 형식이 구체적으로 제시되어 결과의 일관성을 높이는 데 기여합니다.')
  if (d.interpStability >= 8) goodPoints.push('해석의 여지가 좁게 설정되어 AI 출력이 예측 가능한 범위 안에서 수렴할 가능성이 높습니다.')
  if (d.executability >= 11) goodPoints.push('단계적 지시와 출력 요구가 명확해 AI가 즉시 작업에 착수할 수 있는 구조입니다.')
  if (d.structureOrg >= 7) goodPoints.push('문장 구조가 잘 정리되어 있어 AI가 전체 요청을 빠르게 파악할 수 있습니다.')
  if (a.hasRole) goodPoints.push('역할 지정이 포함되어 있어 AI의 답변 톤과 전문성 수준이 일관되게 유지됩니다.')

  if (goodPoints.length > 0) {
    parts.push(goodPoints.slice(0, 2).join(' '))
  } else {
    parts.push('기본적인 요청 구조는 갖추고 있으며, 읽는 데 어려움이 없는 문장으로 작성되어 있습니다.')
  }

  // ④ 개선 방향 (행동 중심)
  const improvements: string[] = []
  if (!a.hasPurpose) improvements.push('요청의 목적이나 활용 상황을 한 문장으로 추가해보세요.')
  if (!a.hasTargetUserWho) improvements.push('누구를 위한 앱/서비스인지(예: "20대 직장인", "초보 학습자")를 명시해보세요.')
  else if (!a.hasTargetAge && !a.hasTargetContext) improvements.push('타겟 사용자의 연령대나 사용 상황을 추가하면 AI가 더 적합한 결과를 생성합니다.')
  if (!a.hasUserAction) improvements.push('사용자가 무엇을 선택/입력하는지, 시스템이 무엇을 보여주는지 인터랙션 흐름을 적어보세요.')
  if (a.outputFormats.length === 0) improvements.push('원하는 출력 형식(예: "3단계로", "표 형태로", "항목별로")을 지정해보세요.')
  if (a.quantifiers.length === 0) improvements.push('개수, 길이, 단계 수 같은 수치 기준을 하나 추가하면 결과 일관성이 높아집니다.')
  if (!a.hasRole) improvements.push('역할을 지정(예: "당신은 마케팅 전문가입니다")하면 AI 답변의 전문성과 톤이 일관되게 유지됩니다.')
  if (a.vagueWords.length >= 2) improvements.push('추상적 표현 대신 구체적인 기준이나 예시를 포함해보세요.')

  if (improvements.length > 0) {
    parts.push(`개선 방향: ${improvements.slice(0, 3).join(' ')}`)
  } else {
    parts.push('현재 구조에 예외 상황, 심화 조건, 또는 예시 데이터를 추가하면 한 단계 더 완성도 높은 결과를 기대할 수 있습니다.')
  }

  return parts.join('\n\n')
}

// ─── 개선점 (상세) ────────────────────────────────────────────────
function buildStrengthsWeaknesses(d: PromptDetails, a: ReturnType<typeof analyze>) {
  const weaknesses: string[] = []

  // ① 요구 명확도
  if (d.reqClarity <= 5)
    weaknesses.push('요청 동사가 불명확하거나 추상적입니다. "만들어줘", "분석해줘"처럼 AI가 수행할 행동을 명확한 동사로 시작해보세요.')
  else if (d.reqClarity <= 9)
    weaknesses.push('목표는 있지만 성공 기준이 빠져 있습니다. "~한 결과를 기대한다", "~조건을 충족해야 한다"처럼 완료 기준을 추가해보세요.')

  // ② 정보 충분성 — 타겟 사용자 중심
  if (!a.hasTargetUserWho)
    weaknesses.push('누구를 위한 앱/서비스인지 명시되지 않았습니다. "20대 직장인", "앱 개발 경험이 없는 소상공인" 등 구체적인 타겟을 적어보세요.')
  else if (!a.hasTargetAge && !a.hasTargetContext)
    weaknesses.push('대상 사용자의 연령대나 사용 상황이 빠져 있습니다. 타겟의 디지털 친숙도나 사용 환경을 추가하면 AI 출력의 적합성이 높아집니다.')
  if (!a.hasBackground && d.infoSufficiency <= 12)
    weaknesses.push('요청 배경이 없어 AI가 맥락을 임의로 가정해야 합니다. 왜 이것이 필요한지, 어떤 상황에서 쓰이는지 한 문장이라도 추가해보세요.')

  // ③ 기능 명세
  if (d.funcSpec <= 4)
    weaknesses.push('기능 목록이 나열되더라도 사용자가 무엇을 선택·입력하고, 시스템이 무엇을 보여주는지 인터랙션 흐름이 없으면 AI가 기능을 피상적으로 설명합니다.')
  else if (!a.hasDataFlow && d.funcSpec <= 9)
    weaknesses.push('기능 간 데이터 흐름(입력→저장→표시, 기록→통계 등)이 명시되지 않았습니다. 데이터가 어떻게 이동하는지 한 줄이라도 서술해보세요.')

  // ④ 구체성
  if (d.specificity <= 4)
    weaknesses.push('수치, 범위, 출력 형식이 전혀 지정되지 않았습니다. "3개 이상", "표 형식으로", "최대 500자" 같은 구체적 조건을 추가해보세요.')
  else if (a.outputFormats.length === 0)
    weaknesses.push('AI에게 출력 형식(목록, 표, 코드, 요약 등)을 지정하지 않으면 매번 다른 포맷으로 응답할 수 있습니다.')

  // ⑤ 해석 안정성
  if (d.interpStability <= 3)
    weaknesses.push('표현이 모호해 동일한 프롬프트로도 전혀 다른 결과가 나올 수 있습니다. 모호한 형용사 대신 측정 가능한 기준을 사용해보세요.')
  if (a.toneConflict || a.scopeConflict)
    weaknesses.push('내부 지시 간 충돌이 감지되었습니다. 예: "간단하게"와 "상세하게"처럼 서로 모순된 조건이 있는지 확인해보세요.')

  // ⑥ 실행 가능성
  if (d.executability <= 5)
    weaknesses.push('AI가 어디서 시작하고 어디서 멈춰야 하는지 판단하기 어렵습니다. 작업을 단계별로 나누거나 우선순위를 명시해보세요.')

  // ⑦ 구조 조직력
  if (d.structureOrg <= 3)
    weaknesses.push('하나의 긴 문장에 모든 요구사항이 섞여 있습니다. 조건·배경·요청을 분리해서 작성하면 AI가 더 정확하게 이해합니다.')

  // ⑧ 추상어 과다
  if (a.vagueWords.length >= 4)
    weaknesses.push(`"${a.vagueWords.slice(0, 3).join('", "')}" 등 추상적 표현이 많습니다. 이런 단어는 AI마다 다르게 해석되므로 구체적 기준���로 교체해보세요.`)

  // 개선점이 없는 경우 (고득점)
  if (weaknesses.length === 0)
    weaknesses.push('전반적으로 잘 작성된 프롬프트입니다. 엣지 케이스나 예외 처리 조건을 추가하면 더 완성도 높은 결과를 얻을 수 있습니다.')

  return { strengths: [] as string[], weaknesses: weaknesses.slice(0, 5) }
}

// ─── 메인 ─────────────────────────────────────────────────────────
export function evaluatePrompt(prompt: string, _topic: string): EvaluationResult {
  if (isInvalidPrompt(prompt)) {
    return {
      promptScore: 0,
      feedback: '유효하지 않은 입력입니다. 5자 이상의 의미 있는 프롬프트를 작성해 주세요.',
      promptDetails: { reqClarity: 0, infoSufficiency: 0, funcSpec: 0, specificity: 0, interpStability: 0, executability: 0, structureOrg: 0, intentConsist: 0, bonus: 0 },
      strengths: [],
      weaknesses: ['5자 이상의 의미 있는 문장을 작성해주세요.', '누구를 위한 것인지, 어떤 기능이 필요한지 적어보세요.', '구체적인 조건이나 출력 형식도 함께 명시해보세요.'],
    }
  }

  const { details, raw } = scoreAll(prompt)
  const score = calcFinalScore(raw)
  const a = analyze(prompt)
  const sw = buildStrengthsWeaknesses(details, a)
  const feedback = buildFeedback(prompt, score, details)

  return {
    promptScore: score,
    feedback,
    promptDetails: details,
    strengths: sw.strengths,
    weaknesses: sw.weaknesses,
  }
}
