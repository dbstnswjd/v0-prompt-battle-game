
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

  // ── 1단계: PRD 관점 전반 진단 ──
  // 5가지 PRD 기준 체크: 문제 정의 / 타겟 사용자 / 사용 시나리오 / 기능 범위 / 완료 기준
  const prdCheck = {
    problemDefined: a.hasPurpose || a.hasBackground,
    targetDefined: a.hasTargetUserWho,
    scenarioDefined: a.hasTargetContext || a.hasUserAction,
    scopeDefined: a.hasFuncName && a.hasFuncPurpose,
    doneCriteriaDefined: a.hasSuccessCriteria || a.hasConstraint,
  }
  const prdPassCount = Object.values(prdCheck).filter(Boolean).length

  if (prdPassCount >= 4) {
    parts.push('개발자가 바로 작업 단위를 나눌 수 있는 수준의 PRD입니다. 구조, 맥락, 기능 범위가 고르게 갖춰져 있습니다.')
  } else if (prdPassCount === 3) {
    parts.push('아이디어 수준에서는 이해되지만, 이 상태로는 개발자가 무엇을 어디까지 구현해야 하는지 명확하게 판단하기 어렵습니다.')
  } else if (prdPassCount === 2) {
    parts.push('방향은 잡혀 있지만, PRD로서 빠진 요소가 많습니다. 개발자에게 전달하면 추가 질문이 많이 나올 구조입니다.')
  } else {
    parts.push('현재 문서는 아이디어 메모 수준입니다. 이 상태로는 개발자가 구현 범위를 설정하기 어렵고, 기획 의도가 제대로 전달되지 않습니다.')
  }

  // ── 2단계: 빠진 PRD 요소 지적 (Before/After 포함) ──
  const missing: string[] = []

  if (!prdCheck.problemDefined) {
    missing.push(
      '이 기능이 해결하려는 사용자 상황이 빠져 있습니다.\n' +
      'Before: "일정 관리 기능 만들어줘"\n' +
      'After: "바쁜 직장인이 하루 할 일을 출근 전 2분 안에 정리할 수 있도록 돕는 기능이다."'
    )
  }

  if (!prdCheck.targetDefined) {
    missing.push(
      '타겟 사용자가 명시되지 않았습니다. 누구를 위한 것인지에 따라 기능 우선순위와 UI 방향이 완전히 달라집니다.\n' +
      'Before: "운동 기록 앱 만들어줘"\n' +
      'After: "운동을 막 시작한 20~30대가 매일 10분 이내로 운동 기록을 남기는 앱이다."'
    )
  }

  if (!prdCheck.scenarioDefined) {
    missing.push(
      '사용 시나리오가 없어 개발자가 화면 흐름을 설계하기 어렵습니다.\n' +
      'Before: "파도 데이터 보여줘"\n' +
      'After: "사용자가 현재 위치 기준 실시간 파도 높이와 예측 데이터를 확인할 수 있는 화면을 구성한다."'
    )
  }

  if (!prdCheck.scopeDefined) {
    missing.push(
      '기능 범위가 불명확합니다. "어디까지 만들면 되는지" 완료 기준이 없으면 개발자가 범위를 임의로 결정하게 됩니다.\n' +
      'Before: "알림 기능도 넣어줘"\n' +
      'After: "사용자가 목표 시간 30분 전에 푸시 알림을 받을 수 있어야 한다. 알림 켜기/끄기 설정 포함."'
    )
  }

  if (!prdCheck.doneCriteriaDefined) {
    missing.push(
      '완료 기준이 없습니다. 개발 완료 시점을 어떻게 판단할지 명시해야 합니다.\n' +
      'Before: "검색 기능 추가"\n' +
      'After: "검색어 입력 후 0.5초 이내에 결과가 표시되어야 하며, 결과가 없으면 \'검색 결과 없음\' 메시지를 표시한다."'
    )
  }

  if (missing.length > 0) {
    parts.push('특히 다음 항목이 빠져 있습니다:\n\n' + missing.slice(0, 2).join('\n\n'))
  }

  // ── 3단계: 유형별 추가 코칭 ──
  const coaching: string[] = []

  if (primary === 'D' && a.vagueWords.length >= 2) {
    coaching.push(
      `"${a.vagueWords.slice(0, 2).join('", "')}" 같은 표현은 PRD에서 사용하기 어렵습니다. ` +
      '개발자는 이 표현을 보고 구현 방식을 스스로 결정해야 합니다. ' +
      '측정 가능한 기준으로 바꿔보세요.'
    )
  }

  if ((primary === 'G' || types.includes('G')) && (a.toneConflict || a.scopeConflict)) {
    coaching.push(
      '내부에서 충돌하는 요구사항이 감지됩니다. ' +
      '예: "간단하게"와 "모든 기능을 포함"처럼 서로 다른 방향의 요건이 함께 있으면 개발자가 어느 쪽을 우선해야 할지 판단할 수 없습니다.'
    )
  }

  if (primary === 'F') {
    coaching.push(
      '잘 작성된 PRD입니다. 한 단계 더 나아가려면 예외 케이스를 추가해보세요. ' +
      '예: "데이터 로딩 실패 시 재시도 버튼을 표시한다", "오프라인 상태에서는 마지막 저장 데이터를 보여준다."'
    )
  }

  if (coaching.length > 0) {
    parts.push(coaching[0])
  }

  // ── 4단계: 다음 액션 (PRD 5기준 체크리스트 기반) ──
  const unchecked = [
    !prdCheck.problemDefined && '문제 정의: 이 기능이 해결하는 사용자 상황',
    !prdCheck.targetDefined && '타겟 사용자: 누구를 위한 것인지 (연령, 상황)',
    !prdCheck.scenarioDefined && '사용 시나리오: 사용자가 어떻게 쓰는지 흐름',
    !prdCheck.scopeDefined && '기능 범위: 무엇을 만들어야 하는지 구체적 목록',
    !prdCheck.doneCriteriaDefined && '완료 기준: 어디까지 만들면 되는지',
  ].filter(Boolean) as string[]

  if (unchecked.length > 0 && primary !== 'F') {
    parts.push('PRD 완성을 위해 다음을 추가해보세요:\n' + unchecked.slice(0, 3).map(u => `· ${u}`).join('\n'))
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
