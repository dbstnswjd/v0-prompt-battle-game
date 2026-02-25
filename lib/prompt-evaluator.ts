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
    roleClarity: number
    structureQuality: number
    outputSpecification: number
  }
  strengths: string[]
  weaknesses: string[]
}

export function evaluatePrompt(prompt: string, topic: string): EvaluationResult {
  const ideaEval = evaluateIdea(prompt, topic)
  const promptEval = evaluatePromptQuality(prompt)

  const finalIdeaScore = applyStrictGrading(ideaEval.total, prompt)
  const finalPromptScore = applyStrictGrading(promptEval.total, prompt)

  const feedback = generateFeedback(finalIdeaScore, finalPromptScore, prompt)
  const analysis = analyzeStrengthsWeaknesses(ideaEval, promptEval, prompt)

  return {
    ideaScore: Math.min(100, Math.max(0, finalIdeaScore)),
    promptScore: Math.min(100, Math.max(0, finalPromptScore)),
    feedback,
    ideaDetails: ideaEval.details,
    promptDetails: promptEval.details,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
  }
}

function applyStrictGrading(score: number, prompt: string): number {
  if (score < 90) return Math.round(score)

  let finalScore = score
  let penalties = 0

  const checks = {
    hasSteps: /\d+\.\s/.test(prompt) || /\n-\s/.test(prompt),
    hasExamples: prompt.includes('\uC608\uC2DC') || prompt.includes('\uC608\uB97C \uB4E4\uC5B4') || prompt.includes('\uC0AC\uB840'),
    hasConstraints: prompt.includes('\uC870\uAC74') || prompt.includes('\uC81C\uC57D'),
    hasFormat: prompt.includes('\uD615\uC2DD') || prompt.includes('\uD3EC\uB9F7') || prompt.includes('\uC591\uC2DD'),
    hasRole: prompt.includes('\uC5ED\uD560') || prompt.includes('\uB2F9\uC2E0\uC740') || prompt.includes('\uC804\uBB38\uAC00'),
    hasContext: prompt.includes('\uB9E5\uB77D') || prompt.includes('\uBC30\uACBD') || prompt.includes('\uC0C1\uD669'),
    hasMetrics: /\d+/.test(prompt) && (prompt.includes('\uAC1C') || prompt.includes('\uAC00\uC9C0') || prompt.includes('\uB2E8\uACC4')),
    hasMultiAspect: prompt.split('\n').length >= 3 || prompt.includes('\uB610\uD55C') || prompt.includes('\uBFD0\uB9CC \uC544\uB2C8\uB77C'),
  }

  if (!checks.hasSteps) penalties += 2.8
  if (!checks.hasExamples) penalties += 2.3
  if (!checks.hasConstraints) penalties += 2.1
  if (!checks.hasFormat) penalties += 2.5
  if (!checks.hasRole) penalties += 2.4
  if (!checks.hasContext) penalties += 1.7
  if (!checks.hasMetrics) penalties += 1.5
  if (!checks.hasMultiAspect) penalties += 1.9

  if (score >= 95) {
    const sophWords = ['\uBD84\uC11D', '\uD3C9\uAC00', '\uACE0\uB824', '\uBC18\uC601', '\uCD5C\uC801\uD654', '\uAC1C\uC120', '\uAC80\uC99D', '\uB3C4\uCD9C', '\uC885\uD569']
    const sophCount = sophWords.filter(kw => prompt.includes(kw)).length
    if (sophCount < 3) penalties += (3 - sophCount) * 1.4

    const structIndicators = [
      prompt.includes('1.') || prompt.includes('\uCCAB\uC9F8'),
      prompt.includes('2.') || prompt.includes('\uB458\uC9F8'),
      prompt.includes('3.') || prompt.includes('\uC14B\uC9F8'),
      prompt.includes('\uB2E8\uACC4') || prompt.includes('\uC808\uCC28'),
      prompt.includes('\uC694\uAD6C\uC0AC\uD56D') || prompt.includes('\uD544\uC218'),
    ]
    const structCount = structIndicators.filter(Boolean).length
    if (structCount < 3) penalties += (3 - structCount) * 1.6

    const numMatches = prompt.match(/\d+/g)
    if (!numMatches || numMatches.length < 3) penalties += 1.8

    const outputWords = ['\uD3EC\uD568', '\uBA85\uC2DC', '\uC791\uC131', '\uC0DD\uC131', '\uC81C\uC2DC', '\uB3C4\uCD9C', '\uC124\uBA85', '\uAE30\uC220']
    const outputCount = outputWords.filter(kw => prompt.includes(kw)).length
    if (outputCount < 2) penalties += 2.0
  }

  if (score >= 98) {
    const steps = prompt.match(/\d+\./g)
    if (!steps || steps.length < 4) penalties += 2.8
    const hasNeg = prompt.includes('\uC81C\uC678') || prompt.includes('\uD53C\uD574') || prompt.includes('\uC54A\uB3C4\uB85D') || prompt.includes('\uAE08\uC9C0')
    if (!hasNeg) penalties += 2.3
    const hasEdge = prompt.includes('\uC8FC\uC758') || prompt.includes('\uACE0\uB824\uC0AC\uD56D') || prompt.includes('\uB2E8,') || prompt.includes('\uB2E4\uB9CC')
    if (!hasEdge) penalties += 2.5
  }

  finalScore = score - penalties
  if (finalScore > 99.5) finalScore = 99.5
  if (finalScore >= 90) return Math.round(finalScore * 10) / 10
  return Math.round(finalScore)
}

interface IdeaEvalResult {
  total: number
  details: {
    creativity: number
    feasibility: number
    specificity: number
    marketability: number
    trendAlignment: number
  }
}

function evaluateIdea(prompt: string, topic: string): IdeaEvalResult {
  let creativity = 55
  let feasibility = 55
  let specificity = 55
  let marketability = 55
  let trendAlignment = 55

  const creativityKw = ['\uC0C8\uB85C\uC6B4', '\uCC3D\uC758\uC801', '\uB3C5\uD2B9\uD55C', '\uD601\uC2E0\uC801', '\uCC28\uBCC4\uD654', '\uAC10\uC131', '\uACBD\uD5D8', '\uC2A4\uD1A0\uB9AC']
  creativity += creativityKw.filter(kw => prompt.includes(kw)).length * 8
  if (prompt.includes('\uBB38\uC81C') || prompt.includes('\uD574\uACB0') || prompt.includes('\uD544\uC694')) creativity += 10
  if (prompt.includes('\uC65C') || prompt.includes('\uC5B4\uB5BB\uAC8C')) creativity += 8
  const innovKw = ['\uC7AC\uD574\uC11D', '\uC804\uD658', '\uC870\uD569', '\uD1B5\uD569', '\uC735\uD569', '\uAC1C\uC120']
  creativity += innovKw.filter(kw => prompt.includes(kw)).length * 7

  const practKw = ['\uAC04\uB2E8', '\uC27D\uAC8C', '\uD3B8\uB9AC', '\uC2E4\uC6A9\uC801', '\uD604\uC2E4\uC801', '\uAC00\uB2A5']
  feasibility += practKw.filter(kw => prompt.includes(kw)).length * 8
  const techKw = ['\uAE30\uC220', '\uC54C\uACE0\uB9AC\uC998', '\uC2DC\uC2A4\uD15C', '\uC790\uB3D9\uD654', '\uB370\uC774\uD130']
  feasibility += techKw.filter(kw => prompt.includes(kw)).length * 7
  if (['\uBCF5\uC7A1\uD55C', '\uC5B4\uB824\uC6B4', '\uACE0\uAE09'].some(w => prompt.includes(w))) feasibility -= 8
  if (prompt.includes('\uBC29\uBC95') || prompt.includes('\uC808\uCC28') || prompt.includes('\uB2E8\uACC4')) feasibility += 12

  const specKw = ['\uAE30\uB2A5', '\uC11C\uBE44\uC2A4', '\uC571', '\uD50C\uB7AB\uD3FC', '\uC2DC\uC2A4\uD15C', '\uC54C\uB9BC', '\uCD94\uCC9C', '\uBD84\uC11D', '\uB370\uC774\uD130']
  specificity += specKw.filter(kw => prompt.includes(kw)).length * 9
  const topicParts = topic.split('/').map(p => p.trim())
  if (topicParts.some(part => prompt.includes(part.replace('\uC744(\uB97C) \uC704\uD55C', '').trim()))) specificity += 15
  const detailKw = ['\uAD6C\uCCB4\uC801\uC73C\uB85C', '\uC0C1\uC138\uD788', '\uC815\uD655\uD788', '\uBA85\uD655\uD788']
  specificity += detailKw.filter(kw => prompt.includes(kw)).length * 9
  if (prompt.includes('\uC0AC\uC6A9\uC790') || prompt.includes('\uB300\uC0C1') || prompt.includes('\uACE0\uAC1D')) specificity += 10
  if (prompt.includes('\uC0C1\uD669') || prompt.includes('\uC2DC\uB098\uB9AC\uC624') || prompt.includes('\uACBD\uC6B0')) specificity += 8

  const appealKw = ['\uD3B8\uB9AC', '\uAC04\uD3B8', '\uC26C\uC6B4', '\uBE60\uB978', '\uC989\uC2DC', '\uD55C\uBC88\uC5D0', '\uC790\uB3D9']
  marketability += appealKw.filter(kw => prompt.includes(kw)).length * 10
  if (prompt.includes('\uC0AC\uC6A9\uC790') || prompt.includes('\uACE0\uAC1D') || prompt.includes('\uC774\uC6A9\uC790')) marketability += 12
  if (prompt.includes('\uACBD\uD5D8') || prompt.includes('\uB9CC\uC871') || prompt.includes('\uC990\uAC70\uC6C0')) marketability += 10
  if (prompt.includes('\uBD88\uD3B8') || prompt.includes('\uC5B4\uB824\uC6C0') || prompt.includes('\uD798\uB4E0')) marketability += 12
  if (prompt.includes('\uD574\uACB0') && (prompt.includes('\uBB38\uC81C') || prompt.includes('pain'))) marketability += 15
  if (['\uACF5\uC720', '\uC18C\uC15C', '\uCEE4\uBBA4\uB2C8\uD2F0', '\uCE5C\uAD6C', '\uD568\uAED8', '\uC5F0\uACB0'].some(kw => prompt.includes(kw))) marketability += 12
  if (prompt.includes('\uB204\uAD6C\uB098') || prompt.includes('\uC27D\uAC8C') || prompt.includes('\uAC04\uB2E8\uD788')) marketability += 10
  if (['\uC990\uAC70\uC6B4', '\uC7AC\uBBF8', '\uAC10\uB3D9', '\uD589\uBCF5', '\uC704\uB85C', '\uACF5\uAC10'].some(kw => prompt.includes(kw))) marketability += 8

  const aiKw = ['AI', '\uC778\uACF5\uC9C0\uB2A5', '\uC0DD\uC131\uD615', 'GPT', '\uCC57\uBD07', '\uC790\uB3D9\uD654', '\uBA38\uC2E0\uB7EC\uB2DD', '\uD559\uC2B5']
  trendAlignment += aiKw.filter(kw => prompt.includes(kw)).length * 12
  const persoKw = ['\uAC1C\uC778\uD654', '\uB9DE\uCDA4', '\uCDE8\uD5A5', '\uCD94\uCC9C', '\uD050\uB808\uC774\uC158', '\uB098\uB9CC\uC758']
  trendAlignment += persoKw.filter(kw => prompt.includes(kw)).length * 10
  if (['\uCE5C\uD658\uACBD', '\uC9C0\uC18D\uAC00\uB2A5', '\uC7AC\uD65C\uC6A9', '\uC5D0\uCF54', '\uD0C4\uC18C', '\uADF8\uB9B0'].some(kw => prompt.includes(kw))) trendAlignment += 11
  if (['\uC0DD\uC0B0\uC131', '\uD6A8\uC728', '\uC2DC\uAC04\uC808\uC57D', '\uAD00\uB9AC', '\uCD5C\uC801\uD654'].some(kw => prompt.includes(kw))) trendAlignment += 10
  if (['\uBA58\uD0C8', '\uC815\uC2E0\uAC74\uAC15', '\uC6F0\uBE59', '\uBA85\uC0C1', '\uD790\uB9C1', '\uCF00\uC5B4', '\uAC74\uAC15'].some(kw => prompt.includes(kw))) trendAlignment += 9
  if (['\uD50C\uB809\uC2A4', '\uAC00\uC131\uBE44', '\uAC00\uC2EC\uBE44', '\uC694\uC998', 'MBTI', '\uBBF8\uB2DD\uC544\uC6C3'].some(kw => prompt.includes(kw))) trendAlignment += 9
  if (['\uBA54\uD0C0\uBC84\uC2A4', '\uAC00\uC0C1', 'VR', 'AR', '\uC544\uBC14\uD0C0', '\uB514\uC9C0\uD138'].some(kw => prompt.includes(kw))) trendAlignment += 8
  if (['\uD06C\uB9AC\uC5D0\uC774\uD130', '\uCF58\uD150\uCE20', '\uCC3D\uC791', '\uC81C\uC791', '\uC778\uD50C\uB8E8\uC5B8\uC11C'].some(kw => prompt.includes(kw))) trendAlignment += 9
  if (['\uC21F\uD3FC', '\uC9E7\uC740', '\uC694\uC57D', '\uD55C\uB208\uC5D0', '\uBE60\uB974\uAC8C', '\uAC04\uB2E8'].some(kw => prompt.includes(kw))) trendAlignment += 7
  if (['\uB370\uC774\uD130', '\uBD84\uC11D', '\uD1B5\uACC4', '\uC778\uC0AC\uC774\uD2B8', '\uC9C0\uD45C'].some(kw => prompt.includes(kw))) trendAlignment += 8

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

interface PromptEvalResult {
  total: number
  details: {
    roleClarity: number
    structureQuality: number
    outputSpecification: number
  }
}

function evaluatePromptQuality(prompt: string): PromptEvalResult {
  let roleClarity = 55
  let structureQuality = 55
  let outputSpecification = 55

  const roleKw = ['\uC5ED\uD560', '\uB2F9\uC2E0\uC740', '\uC804\uBB38\uAC00', '\uB514\uC790\uC774\uB108', '\uAC1C\uBC1C\uC790', '\uAE30\uD68D\uC790', '\uCEE8\uC124\uD134\uD2B8']
  if (roleKw.some(kw => prompt.includes(kw))) roleClarity += 25
  const actionKw = ['\uD574\uC918', '\uB9CC\uB4E4\uC5B4', '\uC791\uC131', '\uC0DD\uC131', '\uBD84\uC11D', '\uCD94\uCC9C']
  if (actionKw.some(kw => prompt.includes(kw))) roleClarity += 18

  if (prompt.includes('\n') || prompt.includes('1.') || prompt.includes('-')) structureQuality += 22
  if (prompt.includes('\uB2E8\uACC4') || prompt.includes('\uC808\uCC28') || prompt.includes('\uC21C\uC11C')) structureQuality += 18
  const vagueKw = ['\uC880', '\uBB54\uAC00', '\uC774\uB7F0', '\uC800\uB7F0', '\uB300\uCDA9']
  structureQuality -= vagueKw.filter(w => prompt.includes(w)).length * 8
  if (prompt.length > 150) structureQuality += 15

  const fmtKw = ['\uD615\uC2DD', '\uD3EC\uB9F7', '\uC591\uC2DD', '\uAD6C\uC870', '\uBAA9\uB85D', '\uD45C', '\uC815\uB9AC']
  outputSpecification += fmtKw.filter(kw => prompt.includes(kw)).length * 12
  if (prompt.includes('\uAD6C\uCCB4\uC801') || prompt.includes('\uC790\uC138\uD788') || prompt.includes('\uC0C1\uC138\uD788')) outputSpecification += 14
  if (prompt.includes('\uC608\uC2DC') || prompt.includes('\uC0AC\uB840') || prompt.includes('\uC608\uB97C \uB4E4\uC5B4')) outputSpecification += 12
  if (prompt.includes('\uC870\uAC74') || prompt.includes('\uC81C\uC57D') || prompt.includes('\uADDC\uCE59')) outputSpecification += 10
  if (prompt.match(/\d+/)) outputSpecification += 10

  roleClarity = Math.min(100, Math.max(0, roleClarity))
  structureQuality = Math.min(100, Math.max(0, structureQuality))
  outputSpecification = Math.min(100, Math.max(0, outputSpecification))

  let total = Math.round((roleClarity + structureQuality + outputSpecification) / 3)
  if (total < 90 && total >= 60) {
    const bonus = Math.min(8, Math.round((90 - total) * 0.15))
    total = Math.min(89, total + bonus)
  }

  return { total, details: { roleClarity, structureQuality, outputSpecification } }
}

function analyzeStrengthsWeaknesses(
  ideaEval: IdeaEvalResult,
  promptEval: PromptEvalResult,
  prompt: string
): { strengths: string[]; weaknesses: string[] } {
  const allS: { score: number; text: string }[] = []
  const allW: { score: number; text: string }[] = []

  if (ideaEval.details.creativity >= 70) allS.push({ score: ideaEval.details.creativity, text: '\uCC3D\uC758\uC801\uC774\uACE0 \uB3C5\uCC3D\uC801\uC778 \uC544\uC774\uB514\uC5B4 \uC811\uADFC' })
  else if (ideaEval.details.creativity < 50) allW.push({ score: 100 - ideaEval.details.creativity, text: '\uC544\uC774\uB514\uC5B4\uC758 \uB3C5\uCC3D\uC131\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4' })

  if (ideaEval.details.feasibility >= 70) allS.push({ score: ideaEval.details.feasibility, text: '\uC2E4\uD604 \uAC00\uB2A5\uC131\uC774 \uB192\uC740 \uD604\uC2E4\uC801 \uC81C\uC548' })
  else if (ideaEval.details.feasibility < 50) allW.push({ score: 100 - ideaEval.details.feasibility, text: '\uC2E4\uD589 \uAC00\uB2A5\uC131\uC744 \uB192\uC774\uB294 \uAD6C\uCCB4\uC801 \uBC29\uC548 \uD544\uC694' })

  if (ideaEval.details.specificity >= 70) allS.push({ score: ideaEval.details.specificity, text: '\uAD6C\uCCB4\uC801\uC774\uACE0 \uBA85\uD655\uD55C \uBB38\uC81C \uC815\uC758' })
  else if (ideaEval.details.specificity < 50) allW.push({ score: 100 - ideaEval.details.specificity, text: '\uC8FC\uC81C\uC5D0 \uB300\uD55C \uAD6C\uCCB4\uC131\uACFC \uC138\uBD80 \uC0AC\uD56D \uBCF4\uC644 \uD544\uC694' })

  if (ideaEval.details.marketability >= 70) allS.push({ score: ideaEval.details.marketability, text: '\uC2DC\uC7A5\uC5D0\uC11C\uC758 \uC218\uC694\uC640 \uAD00\uB828\uC131\uC774 \uB192\uC74C' })
  else if (ideaEval.details.marketability < 50) allW.push({ score: 100 - ideaEval.details.marketability, text: '\uC2DC\uC7A5\uC5D0\uC11C\uC758 \uC218\uC694\uC640 \uAD00\uB828\uC131\uC744 \uB192\uC774\uB294 \uBC29\uC548 \uD544\uC694' })

  if (ideaEval.details.trendAlignment >= 70) allS.push({ score: ideaEval.details.trendAlignment, text: '\uCD5C\uC2E0 \uD2B8\uB80C\uB4DC\uC640 \uC77C\uCE58\uD558\uB294 \uC544\uC774\uB514\uC5B4' })
  else if (ideaEval.details.trendAlignment < 50) allW.push({ score: 100 - ideaEval.details.trendAlignment, text: '\uCD5C\uC2E0 \uD2B8\uB80C\uB4DC\uC640\uC758 \uC77C\uCE58\uC131\uC744 \uB192\uC774\uB294 \uBC29\uC548 \uD544\uC694' })

  if (promptEval.details.roleClarity >= 70) allS.push({ score: promptEval.details.roleClarity, text: 'AI\uC758 \uC5ED\uD560\uACFC \uBAA9\uC801\uC774 \uBA85\uD655\uD558\uAC8C \uC815\uC758\uB428' })
  else if (promptEval.details.roleClarity < 50) allW.push({ score: 100 - promptEval.details.roleClarity, text: 'AI\uC5D0\uAC8C \uC694\uAD6C\uD558\uB294 \uC5ED\uD560\uC744 \uB354 \uBA85\uD655\uD788 \uC81C\uC2DC\uD558\uC138\uC694' })

  if (promptEval.details.structureQuality >= 70) allS.push({ score: promptEval.details.structureQuality, text: '\uCCB4\uACC4\uC801\uC774\uACE0 \uB17C\uB9AC\uC801\uC778 \uD504\uB86C\uD504\uD2B8 \uAD6C\uC870' })
  else if (promptEval.details.structureQuality < 50) allW.push({ score: 100 - promptEval.details.structureQuality, text: '\uD504\uB86C\uD504\uD2B8 \uAD6C\uC870\uC640 \uB17C\uB9AC\uC131 \uAC1C\uC120 \uD544\uC694' })

  if (promptEval.details.outputSpecification >= 70) allS.push({ score: promptEval.details.outputSpecification, text: '\uCD9C\uB825 \uD615\uC2DD\uACFC \uC870\uAC74\uC774 \uAD6C\uCCB4\uC801\uC73C\uB85C \uBA85\uC2DC\uB428' })
  else if (promptEval.details.outputSpecification < 50) allW.push({ score: 100 - promptEval.details.outputSpecification, text: '\uC6D0\uD558\uB294 \uCD9C\uB825 \uD615\uC2DD\uACFC \uC870\uAC74\uC744 \uB354 \uC0C1\uC138\uD788 \uC791\uC131\uD558\uC138\uC694' })

  if (prompt.length > 200) allS.push({ score: 75, text: '\uCDA9\uBD84\uD55C \uBD84\uB7C9\uC73C\uB85C \uC0C1\uC138\uD55C \uC124\uBA85 \uC81C\uACF5' })

  allS.sort((a, b) => b.score - a.score)
  allW.sort((a, b) => b.score - a.score)

  const strengths = allS.slice(0, 2).map(s => s.text)
  const weaknesses = allW.slice(0, 2).map(w => w.text)

  while (strengths.length < 2) {
    strengths.push(strengths.length === 0 ? '\uC8FC\uC81C\uB97C \uC774\uD574\uD558\uACE0 \uC811\uADFC\uD558\uB824\uB294 \uC2DC\uB3C4\uAC00 \uBCF4\uC785\uB2C8\uB2E4' : '\uD504\uB86C\uD504\uD2B8 \uC791\uC131\uC5D0 \uB300\uD55C \uAE30\uBCF8 \uC774\uD574\uAC00 \uC788\uC2B5\uB2C8\uB2E4')
  }
  while (weaknesses.length < 2) {
    weaknesses.push(weaknesses.length === 0 ? '\uB354 \uAD6C\uCCB4\uC801\uC778 \uC124\uBA85\uC744 \uCD94\uAC00\uD558\uBA74 \uC88B\uACA0\uC2B5\uB2C8\uB2E4' : '\uC2E4\uD589 \uAC00\uB2A5\uD55C \uC138\uBD80 \uBC29\uC548\uC744 \uBCF4\uC644\uD574\uBCF4\uC138\uC694')
  }

  return { strengths, weaknesses }
}

function generateFeedback(ideaScore: number, promptScore: number, prompt: string): string {
  const avgScore = (ideaScore + promptScore) / 2
  const parts: string[] = []

  if (avgScore >= 80) {
    parts.push('\uC804\uBC18\uC801\uC73C\uB85C \uB9E4\uC6B0 \uB192\uC740 \uC218\uC900\uC758 \uD504\uB86C\uD504\uD2B8\uC785\uB2C8\uB2E4.')
  } else if (avgScore >= 65) {
    parts.push('\uAE30\uBCF8\uAE30\uAC00 \uAC16\uCDB0\uC9C4 \uD504\uB86C\uD504\uD2B8\uC774\uB098, \uBA87 \uAC00\uC9C0 \uBCF4\uC644 \uD3EC\uC778\uD2B8\uAC00 \uC788\uC2B5\uB2C8\uB2E4.')
  } else if (avgScore >= 50) {
    parts.push('\uD575\uC2EC \uC544\uC774\uB514\uC5B4\uB294 \uC7A1\uC558\uC9C0\uB9CC, \uC804\uB2EC \uBC29\uC2DD\uC5D0\uC11C \uC544\uC26C\uC6C0\uC774 \uB0A8\uC2B5\uB2C8\uB2E4.')
  } else {
    parts.push('\uD504\uB86C\uD504\uD2B8\uC758 \uC804\uBC18\uC801\uC778 \uBC29\uD5A5\uACFC \uAD6C\uC870 \uBAA8\uB450 \uC7AC\uAC80\uD1A0\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.')
  }

  if (ideaScore >= 80) {
    parts.push('\uC544\uC774\uB514\uC5B4 \uCE21\uBA74\uC5D0\uC11C\uB294 \uC8FC\uC81C\uB97C \uAE4A\uC774 \uC788\uAC8C \uD574\uC11D\uD558\uACE0 \uB3C5\uCC3D\uC801\uC778 \uC2DC\uAC01\uC744 \uBCF4\uC5EC\uC8FC\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uBB38\uC81C \uC815\uC758\uBD80\uD130 \uD574\uACB0 \uBC29\uD5A5\uAE4C\uC9C0 \uB17C\uB9AC\uC801\uC73C\uB85C \uC5F0\uACB0\uB418\uC5B4 \uC788\uC5B4 \uC2E4\uC81C \uC11C\uBE44\uC2A4\uD654\uD588\uC744 \uB54C\uB3C4 \uACBD\uC7C1\uB825\uC774 \uC788\uC744 \uAC83\uC73C\uB85C \uBCF4\uC785\uB2C8\uB2E4.')
  } else if (ideaScore >= 65) {
    if (prompt.includes('\uBB38\uC81C') || prompt.includes('\uD574\uACB0')) {
      parts.push('\uBB38\uC81C \uC778\uC2DD\uC740 \uB69C\uB837\uD558\uB098, \uD574\uACB0 \uBC29\uC548\uC774 \uC880 \uB354 \uAD6C\uCCB4\uC801\uC774\uBA74 \uC88B\uACA0\uC2B5\uB2C8\uB2E4. \uC544\uC774\uB514\uC5B4\uAC00 \uC2E4\uC81C\uB85C \uAD6C\uD604\uB418\uC5C8\uC744 \uB54C \uC0AC\uC6A9\uC790\uAC00 \uC5B4\uB5A4 \uAC00\uCE58\uB97C \uB290\uB084\uC9C0\uC5D0 \uB300\uD55C \uC124\uBA85\uC744 \uCD94\uAC00\uD558\uBA74 \uC124\uB4DD\uB825\uC774 \uD06C\uAC8C \uC62C\uB77C\uAC08 \uAC83\uC785\uB2C8\uB2E4.')
    } else {
      parts.push('\uC544\uC774\uB514\uC5B4\uC5D0 \uC7A0\uC7AC\uB825\uC774 \uC788\uC9C0\uB9CC, "\uC65C \uC774\uAC83\uC774 \uD544\uC694\uD55C\uAC00"\uC5D0 \uB300\uD55C \uADFC\uAC70\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4. \uB300\uC0C1 \uC0AC\uC6A9\uC790\uC758 \uBD88\uD3B8\uD568\uC774\uB098 \uB2C8\uC988\uB97C \uBA3C\uC800 \uC815\uC758\uD558\uACE0, \uADF8\uAC83\uC744 \uC5B4\uB5BB\uAC8C \uD574\uACB0\uD558\uB294\uC9C0 \uD750\uB984\uC744 \uC7A1\uC544\uBCF4\uC138\uC694.')
    }
  } else if (ideaScore >= 50) {
    parts.push('\uC544\uC774\uB514\uC5B4\uAC00 \uB2E4\uC18C \uC77C\uBC18\uC801\uC778 \uC218\uC900\uC5D0 \uBA38\uBB3C\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uBE44\uC2B7\uD55C \uC11C\uBE44\uC2A4\uB098 \uC194\uB8E8\uC158\uC774 \uC774\uBBF8 \uC874\uC7AC\uD558\uB294\uC9C0 \uCC28\uBCC4\uC810\uC740 \uBB34\uC5C7\uC778\uC9C0 \uACE0\uBBFC\uD574\uBCF4\uC138\uC694. "\uAE30\uC874\uC5D0 \uC5C6\uB294 \uAC00\uCE58"\uB97C \uD55C \uC904\uB85C \uC124\uBA85\uD560 \uC218 \uC788\uB2E4\uBA74 \uC88B\uC740 \uC544\uC774\uB514\uC5B4\uC758 \uCCAB\uAC78\uC74C\uC785\uB2C8\uB2E4.')
  } else {
    parts.push('\uC544\uC774\uB514\uC5B4\uAC00 \uC8FC\uC81C\uC640\uC758 \uC5F0\uACB0\uC131\uC774 \uC57D\uD558\uAC70\uB098, \uCD94\uC0C1\uC801\uC778 \uB2E8\uC5B4 \uB098\uC5F4\uC5D0 \uADF8\uCE58\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC8FC\uC81C\uC758 \uD575\uC2EC \uD0A4\uC6CC\uB4DC\uB97C \uB2E4\uC2DC \uC77D\uACE0, "\uB204\uAD6C\uC5D0\uAC8C", "\uC5B4\uB5A4 \uC0C1\uD669\uC5D0\uC11C", "\uBB34\uC2A8 \uBB38\uC81C\uB97C" \uD574\uACB0\uD558\uB294\uC9C0 \uAD6C\uCCB4\uC801\uC73C\uB85C \uC368\uBCF4\uC138\uC694.')
  }

  if (promptScore >= 80) {
    parts.push('\uD504\uB86C\uD504\uD2B8 \uAD6C\uC870\uB3C4 \uC6B0\uC218\uD569\uB2C8\uB2E4. AI\uC5D0\uAC8C \uC5ED\uD560\uC744 \uBD80\uC5EC\uD558\uACE0, \uB2E8\uACC4\uBCC4\uB85C \uC9C0\uC2DC\uD558\uBA70, \uCD9C\uB825 \uD615\uC2DD\uAE4C\uC9C0 \uBA85\uC2DC\uD55C \uC810\uC774 \uC778\uC0C1\uC801\uC785\uB2C8\uB2E4. \uC774 \uC218\uC900\uC774\uBA74 \uC2E4\uC81C GPT\uC5D0 \uC785\uB825\uD574\uB3C4 \uBC14\uB85C \uC591\uC9C8\uC758 \uACB0\uACFC\uB97C \uAE30\uB300\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.')
  } else if (promptScore >= 65) {
    const hasRole = prompt.includes('\uC5ED\uD560') || prompt.includes('\uB2F9\uC2E0\uC740') || prompt.includes('\uC804\uBB38\uAC00')
    const hasFormat = prompt.includes('\uD615\uC2DD') || prompt.includes('\uD3EC\uB9F7') || prompt.includes('\uBAA9\uB85D') || prompt.includes('\uD45C')
    if (!hasRole && !hasFormat) {
      parts.push('\uD504\uB86C\uD504\uD2B8 \uAD6C\uC870\uC5D0\uC11C \uAC00\uC7A5 \uC544\uC26C\uC6B4 \uC810\uC740 AI\uC758 \uC5ED\uD560 \uC124\uC815\uACFC \uCD9C\uB825 \uD615\uC2DD\uC774 \uBE60\uC838\uC788\uB2E4\uB294 \uAC83\uC785\uB2C8\uB2E4. "\uB2F9\uC2E0\uC740 ~\uBD84\uC57C \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4"\uB85C \uC2DC\uC791\uD558\uACE0, "~\uD615\uC2DD\uC73C\uB85C \uC815\uB9AC\uD574\uC918"\uB77C\uACE0 \uB9C8\uBB34\uB9AC\uD558\uBA74 \uACB0\uACFC\uC758 \uC9C8\uC774 \uD06C\uAC8C \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.')
    } else if (!hasRole) {
      parts.push('\uCD9C\uB825 \uC870\uAC74\uC740 \uC5B4\uB290 \uC815\uB3C4 \uAC16\uCDB0\uC5C8\uC73C\uB098, AI\uC5D0\uAC8C \uC5B4\uB5A4 \uAD00\uC810\uC5D0\uC11C \uB2F5\uD574\uC57C \uD558\uB294\uC9C0 \uC5ED\uD560\uC744 \uBD80\uC5EC\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. "\uB2F9\uC2E0\uC740 ~\uC785\uB2C8\uB2E4" \uD55C \uBB38\uC7A5\uB9CC \uCD94\uAC00\uD574\uB3C4 AI\uC758 \uB2F5\uBCC0 \uD1A4\uACFC \uAE4A\uC774\uAC00 \uC644\uC804\uD788 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.')
    } else if (!hasFormat) {
      parts.push('\uC5ED\uD560 \uC124\uC815\uC740 \uC798 \uB418\uC5B4\uC788\uC73C\uB098, AI\uAC00 \uC5B4\uB5A4 \uD615\uD0DC\uB85C \uACB0\uACFC\uBB3C\uC744 \uB9CC\uB4E4\uC5B4\uC57C \uD558\uB294\uC9C0 \uBD88\uBA85\uD655\uD569\uB2C8\uB2E4. "\uD45C\uB85C \uC815\uB9AC\uD574\uC918", "3\uAC00\uC9C0 \uC635\uC158\uC73C\uB85C \uC81C\uC2DC\uD574\uC918" \uAC19\uC740 \uCD9C\uB825 \uD615\uC2DD \uC9C0\uC815\uC744 \uCD94\uAC00\uD574\uBCF4\uC138\uC694.')
    } else {
      parts.push('\uD504\uB86C\uD504\uD2B8 \uC791\uC131 \uAE30\uC220\uC774 \uC591\uD638\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uC870\uAC74\uC774\uB098 \uC81C\uC57D\uC0AC\uD56D\uC744 \uCD94\uAC00\uD558\uBA74 AI\uAC00 \uB354 \uC815\uD655\uD55C \uACB0\uACFC\uB97C \uB9CC\uB4E4\uC5B4\uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC608\uB97C \uB4E4\uC5B4 "~\uB294 \uC81C\uC678\uD558\uACE0", "~\uB97C \uBC18\uB4DC\uC2DC \uD3EC\uD568\uD574\uC11C" \uAC19\uC740 \uAD6C\uCCB4\uC801 \uC870\uAC74\uC744 \uB123\uC5B4\uBCF4\uC138\uC694.')
    }
  } else if (promptScore >= 50) {
    parts.push('\uD504\uB86C\uD504\uD2B8\uAC00 "~\uD574\uC918"\uB77C\uB294 \uB2E8\uC21C \uC694\uCCAD \uC218\uC900\uC5D0 \uAC00\uAE5D\uC2B5\uB2C8\uB2E4. \uC88B\uC740 \uD504\uB86C\uD504\uD2B8\uB294 \uC138 \uAC00\uC9C0\uB97C \uAC16\uCDB0\uC57C \uD569\uB2C8\uB2E4: (1) AI\uC758 \uC5ED\uD560/\uAD00\uC810 \uC124\uC815, (2) \uB2E8\uACC4\uBCC4 \uC9C0\uC2DC\uC0AC\uD56D, (3) \uC6D0\uD558\uB294 \uCD9C\uB825\uC758 \uD615\uC2DD\uACFC \uC870\uAC74. \uC774 \uC138 \uAC00\uC9C0\uB97C \uC758\uC2DD\uD558\uBA70 \uB2E4\uC2DC \uC791\uC131\uD574\uBCF4\uC138\uC694.')
  } else {
    parts.push('\uD504\uB86C\uD504\uD2B8\uAC00 \uB108\uBB34 \uC9E7\uAC70\uB098 \uBAA8\uD638\uD558\uC5EC AI\uAC00 \uC758\uB3C4\uB97C \uD30C\uC545\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uCD5C\uC18C\uD55C "\uB204\uAD6C(\uC5ED\uD560)"\uC5D0\uAC8C "\uBB34\uC5C7(\uACFC\uC81C)"\uC744 "\uC5B4\uB5BB\uAC8C(\uD615\uC2DD)" \uD574\uB2EC\uB77C\uB294 \uC138 \uC694\uC18C\uB97C \uB2F4\uC544\uC57C \uD569\uB2C8\uB2E4. \uD55C \uC904\uC9DC\uB9AC \uC9C8\uBB38\uBCF4\uB2E4\uB294 \uB9E5\uB77D\uACFC \uC870\uAC74\uC744 \uD568\uAED8 \uC81C\uC2DC\uD574\uBCF4\uC138\uC694.')
  }

  const gap = Math.abs(ideaScore - promptScore)
  if (gap >= 20) {
    if (ideaScore > promptScore) {
      parts.push('[Tip] \uC544\uC774\uB514\uC5B4 \uAC10\uAC01\uC740 \uB6F0\uC5B4\uB098\uB2C8, \uD504\uB86C\uD504\uD2B8 \uC5D4\uC9C0\uB2C8\uC5B4\uB9C1 \uAE30\uBC95(\uC5ED\uD560 \uBD80\uC5EC, \uB2E8\uACC4 \uBD84\uB9AC, \uCD9C\uB825 \uD615\uC2DD \uC9C0\uC815)\uC744 \uC5F0\uC2B5\uD558\uBA74 \uC810\uC218\uAC00 \uD06C\uAC8C \uC624\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.')
    } else {
      parts.push('[Tip] \uD504\uB86C\uD504\uD2B8 \uC791\uC131 \uAE30\uC220\uC740 \uC88B\uC73C\uB2C8, \uC8FC\uC81C\uB97C \uB354 \uAE4A\uC774 \uBD84\uC11D\uD558\uACE0 \uCC28\uBCC4\uD654\uB41C \uC544\uC774\uB514\uC5B4\uB97C \uAD6C\uC0C1\uD558\uB294 \uB370 \uC2DC\uAC04\uC744 \uD22C\uC790\uD574\uBCF4\uC138\uC694.')
    }
  } else if (avgScore < 65) {
    parts.push('[Tip] \uB2E4\uC74C \uB77C\uC6B4\uB4DC\uC5D0\uC11C\uB294 \uD504\uB86C\uD504\uD2B8\uB97C \uC4F0\uAE30 \uC804\uC5D0 30\uCD08\uB9CC "\uC774 \uC8FC\uC81C\uC758 \uD575\uC2EC \uBB38\uC81C\uAC00 \uBB58\uAE4C?"\uB97C \uBA3C\uC800 \uC0DD\uAC01\uD574\uBCF4\uC138\uC694. \uADF8 \uD55C \uBB38\uC7A5\uC774 \uC804\uCCB4 \uD504\uB86C\uD504\uD2B8\uC758 \uBC29\uD5A5\uC744 \uC7A1\uC544\uC90D\uB2C8\uB2E4.')
  } else if (avgScore >= 80) {
    const hasExample = prompt.includes('\uC608\uC2DC') || prompt.includes('\uC0AC\uB840') || prompt.includes('\uC608\uB97C \uB4E4\uC5B4')
    const hasNeg = prompt.includes('\uC81C\uC678') || prompt.includes('\uD53C\uD574') || prompt.includes('\uC54A\uB3C4\uB85D')
    if (!hasExample) {
      parts.push('[Tip] \uC774\uBBF8 \uD6CC\uB96D\uD558\uC9C0\uB9CC, \uAD6C\uCCB4\uC801\uC778 \uC608\uC2DC("\uC608\uB97C \uB4E4\uC5B4 ~\uC640 \uAC19\uC740")\uB97C 1-2\uAC1C \uCD94\uAC00\uD558\uBA74 AI\uAC00 \uC758\uB3C4\uB97C \uB354 \uC815\uD655\uD788 \uD30C\uC545\uD569\uB2C8\uB2E4.')
    } else if (!hasNeg) {
      parts.push('[Tip] \uAC70\uC758 \uC644\uBCBD\uC5D0 \uAC00\uAE4C\uC6B4 \uD504\uB86C\uD504\uD2B8\uC785\uB2C8\uB2E4. "~\uB294 \uC81C\uC678\uD574\uC918"\uCC98\uB7FC \uB124\uAC70\uD2F0\uBE0C \uC870\uAC74\uC744 \uCD94\uAC00\uD558\uBA74 \uBD88\uD544\uC694\uD55C \uACB0\uACFC\uB97C \uC0AC\uC804\uC5D0 \uAC78\uB7EC\uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4.')
    } else {
      parts.push('[Tip] \uB9E4\uC6B0 \uC644\uC131\uB3C4 \uB192\uC740 \uD504\uB86C\uD504\uD2B8\uC785\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9\uC73C\uB85C "\uACB0\uACFC\uB97C \uC790\uAE30 \uAC80\uC99D\uD558\uACE0 \uBD80\uC871\uD55C \uBD80\uBD84\uC744 \uBCF4\uC644\uD574\uC918"\uB77C\uB294 \uBA54\uD0C0 \uC9C0\uC2DC\uB97C \uCD94\uAC00\uD574\uBCF4\uC138\uC694.')
    }
  }

  return parts.join(' ')
}
