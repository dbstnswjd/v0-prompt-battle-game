// AI-style prompt evaluator

interface EvaluationResult {
  ideaScore: number;
  promptScore: number;
  feedback: string;
  ideaDetails: {
    creativity: number;
    feasibility: number;
    specificity: number;
    marketability: number;
    trendAlignment: number;
  };
  promptDetails: {
    roleClarity: number;
    structureQuality: number;
    outputSpecification: number;
  };
  strengths: string[];
  weaknesses: string[];
}

export function evaluatePrompt(prompt: string, topic: string): EvaluationResult {
  // Idea Score Evaluation with details
  const ideaEval = evaluateIdea(prompt, topic);
  
  // Prompt Score Evaluation with details
  const promptEval = evaluatePromptQuality(prompt);
  
  // Apply strict grading for high scores (90+)
  const finalIdeaScore = applyStrictGrading(ideaEval.total, prompt, 'idea');
  const finalPromptScore = applyStrictGrading(promptEval.total, prompt, 'prompt');
  
  // Generate feedback
  const feedback = generateFeedback(finalIdeaScore, finalPromptScore, prompt);
  
  // Analyze strengths and weaknesses
  const analysis = analyzeStrengthsWeaknesses(prompt, ideaEval, promptEval);
  
  return {
    ideaScore: Math.min(100, Math.max(0, finalIdeaScore)),
    promptScore: Math.min(100, Math.max(0, finalPromptScore)),
    feedback,
    ideaDetails: ideaEval.details,
    promptDetails: promptEval.details,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
  };
}

// Strict grading for scores 90+
function applyStrictGrading(score: number, prompt: string, type: 'idea' | 'prompt'): number {
  if (score < 90) return Math.round(score);
  
  // For 90+ scores, apply very strict criteria
  let finalScore = score;
  let penalties = 0;
  
  // Perfect score (100) requirements - almost impossible to achieve
  const perfectRequirements = {
    hasNumberedSteps: /\d+\.\s/.test(prompt) || /\n-\s/.test(prompt),
    hasExamples: prompt.includes('예시') || prompt.includes('예를 들어') || prompt.includes('사례'),
    hasConstraints: prompt.includes('조건') || prompt.includes('제약'),
    hasOutputFormat: prompt.includes('형식') || prompt.includes('포맷') || prompt.includes('양식') || prompt.includes('구조'),
    hasRole: prompt.includes('역할') || prompt.includes('당신은') || prompt.includes('전문가') || /~로서|~처럼/.test(prompt),
    hasContext: prompt.includes('맥락') || prompt.includes('배경') || prompt.includes('상황'),
    hasMetrics: /\d+/.test(prompt) && (prompt.includes('개') || prompt.includes('가지') || prompt.includes('단계')),
    hasMultipleAspects: prompt.split('\n').length >= 3 || prompt.includes('그리고') || prompt.includes('또한') || prompt.includes('뿐만 아니라'),
  };
  
  // Strict deductions for missing critical elements
  if (!perfectRequirements.hasNumberedSteps) penalties += 2.8;
  if (!perfectRequirements.hasExamples) penalties += 2.3;
  if (!perfectRequirements.hasConstraints) penalties += 2.1;
  if (!perfectRequirements.hasOutputFormat) penalties += 2.5;
  if (!perfectRequirements.hasRole) penalties += 2.4;
  if (!perfectRequirements.hasContext) penalties += 1.7;
  if (!perfectRequirements.hasMetrics) penalties += 1.5;
  if (!perfectRequirements.hasMultipleAspects) penalties += 1.9;
  
  // Additional strict checks for 95+ scores
  if (score >= 95) {
    // Check for depth and sophistication
    const sophisticationKeywords = ['분석', '평가', '고려', '반영', '최적화', '개선', '검증', '도출', '종합'];
    const sophisticationCount = sophisticationKeywords.filter(kw => prompt.includes(kw)).length;
    if (sophisticationCount < 3) penalties += (3 - sophisticationCount) * 1.4;
    
    // Check for structural indicators (but not just length)
    const structuralIndicators = [
      prompt.includes('1.') || prompt.includes('첫째'),
      prompt.includes('2.') || prompt.includes('둘째'),
      prompt.includes('3.') || prompt.includes('셋째'),
      prompt.includes('단계') || prompt.includes('절차'),
      prompt.includes('요구사항') || prompt.includes('필수'),
    ];
    const structureCount = structuralIndicators.filter(Boolean).length;
    if (structureCount < 3) penalties += (3 - structureCount) * 1.6;
    
    // Check for specificity in numbers and quantification
    const numberMatches = prompt.match(/\d+/g);
    if (!numberMatches || numberMatches.length < 3) penalties += 1.8;
    
    // Check for multiple output requirements
    const outputKeywords = ['포함', '명시', '작성', '생성', '제시', '도출', '설명', '기술'];
    const outputCount = outputKeywords.filter(kw => prompt.includes(kw)).length;
    if (outputCount < 2) penalties += 2.0;
    
    // Check for quality indicators
    const qualityKeywords = ['구체적', '명확', '상세', '정확', '체계적'];
    const qualityCount = qualityKeywords.filter(kw => prompt.includes(kw)).length;
    if (qualityCount === 0) penalties += 1.5;
  }
  
  // For 98+ scores, apply even more extreme scrutiny
  if (score >= 98) {
    // Must have clear multi-step structure
    const steps = prompt.match(/\d+\./g);
    if (!steps || steps.length < 4) penalties += 2.8;
    
    // Must have both positive and negative constraints
    const hasNegativeConstraints = prompt.includes('제외') || prompt.includes('피해') || prompt.includes('않도록') || prompt.includes('금지');
    if (!hasNegativeConstraints) penalties += 2.3;
    
    // Must show awareness of edge cases or considerations
    const hasEdgeCases = prompt.includes('주의') || prompt.includes('고려사항') || prompt.includes('단,') || prompt.includes('다만') || prompt.includes('참고');
    if (!hasEdgeCases) penalties += 2.5;
    
    // Must have meta-instructions about output quality
    const hasQualityControl = prompt.includes('품질') || prompt.includes('정확성') || prompt.includes('검증') || prompt.includes('확인');
    if (!hasQualityControl) penalties += 2.0;
    
    // Must demonstrate understanding of target audience or use case
    const hasAudienceAwareness = prompt.includes('사용자') || prompt.includes('대상') || prompt.includes('고객') || prompt.includes('위한');
    if (!hasAudienceAwareness) penalties += 1.8;
  }
  
  finalScore = score - penalties;
  
  // Cap at 99.5 - 100.0 is virtually impossible
  if (finalScore > 99.5) finalScore = 99.5;
  
  // Return with decimal precision for 90+ scores
  if (finalScore >= 90) {
    return Math.round(finalScore * 10) / 10; // One decimal place
  }
  
  return Math.round(finalScore);
}

function evaluateIdea(prompt: string, topic: string): { total: number; details: any } {
  let creativity = 55;
  let feasibility = 55;
  let specificity = 55;
  let marketability = 55;
  let trendAlignment = 55;
  
  // Creativity evaluation
  const creativityKeywords = ['새로운', '창의적', '독특한', '혁신적', '차별화', '감성', '경험', '��토리'];
  const creativityCount = creativityKeywords.filter(kw => prompt.includes(kw)).length;
  creativity += creativityCount * 8;
  
  // Problem-solution thinking
  if (prompt.includes('문제') || prompt.includes('해결') || prompt.includes('필요')) creativity += 10;
  if (prompt.includes('왜') || prompt.includes('어떻게')) creativity += 8;
  
  // Innovation depth
  const innovationKeywords = ['재해석', '전환', '조합', '통합', '융합', '개선'];
  const innovationCount = innovationKeywords.filter(kw => prompt.includes(kw)).length;
  creativity += innovationCount * 7;
  
  // Feasibility evaluation
  const practicalKeywords = ['간단', '쉽게', '편리', '실용적', '현실적', '가능'];
  const practicalCount = practicalKeywords.filter(kw => prompt.includes(kw)).length;
  feasibility += practicalCount * 8;
  
  const technicalKeywords = ['기술', '알고리즘', '시스템', '자동화', '데이터'];
  const technicalCount = technicalKeywords.filter(kw => prompt.includes(kw)).length;
  feasibility += technicalCount * 7;
  
  // Complexity penalties (reduced)
  const complexWords = ['복잡한', '어려운', '고급'];
  if (complexWords.some(w => prompt.includes(w))) feasibility -= 8;
  
  // Implementation clarity
  if (prompt.includes('방법') || prompt.includes('절차') || prompt.includes('단계')) feasibility += 12;
  
  // Specificity evaluation
  const specificityIndicators = ['기능', '서비스', '앱', '플랫폼', '시스템', '알림', '추천', '분석', '데이터'];
  const specificityCount = specificityIndicators.filter(kw => prompt.includes(kw)).length;
  specificity += specificityCount * 9;
  
  // Topic alignment
  const topicParts = topic.split('/').map(part => part.trim());
  const targetAwareness = topicParts.some(part => 
    prompt.includes(part.replace('을(를) 위한', '').trim())
  );
  if (targetAwareness) specificity += 15;
  
  // Detail indicators
  const detailKeywords = ['구체적으로', '상세히', '정확히', '명확히'];
  const detailCount = detailKeywords.filter(kw => prompt.includes(kw)).length;
  specificity += detailCount * 9;
  
  // Use case specificity
  if (prompt.includes('사용자') || prompt.includes('대상') || prompt.includes('고객')) specificity += 10;
  if (prompt.includes('상황') || prompt.includes('시나리오') || prompt.includes('경우')) specificity += 8;
  
  // Marketability evaluation - 사람들이 얼마나 좋아할지
  const userAppealKeywords = ['편리', '간편', '쉬운', '빠른', '즉시', '한번에', '자동'];
  const userAppealCount = userAppealKeywords.filter(kw => prompt.includes(kw)).length;
  marketability += userAppealCount * 10;
  
  // User experience focus
  if (prompt.includes('사용자') || prompt.includes('고객') || prompt.includes('이용자')) marketability += 12;
  if (prompt.includes('경험') || prompt.includes('만족') || prompt.includes('즐거움')) marketability += 10;
  
  // Problem-solution fit (실제 문제 해결)
  if (prompt.includes('불편') || prompt.includes('어려움') || prompt.includes('힘든')) marketability += 12;
  if (prompt.includes('해결') && (prompt.includes('문제') || prompt.includes('pain'))) marketability += 15;
  
  // Social and viral potential
  const socialKeywords = ['공유', '소셜', '커뮤니티', '친구', '함께', '연결'];
  if (socialKeywords.some(kw => prompt.includes(kw))) marketability += 12;
  
  // Accessibility and ease of use
  if (prompt.includes('누구나') || prompt.includes('쉽게') || prompt.includes('간단히')) marketability += 10;
  
  // Emotional appeal
  const emotionalKeywords = ['즐거운', '재미', '감동', '행복', '위로', '공감'];
  if (emotionalKeywords.some(kw => prompt.includes(kw))) marketability += 8;
  
  // Trend alignment evaluation - 현재 트렌드
  // 2025-2026 major trends
  
  // AI & Automation trend (가장 핫한 트렌드)
  const aiKeywords = ['AI', '인공지능', '생성형', 'GPT', '챗봇', '자동화', '머신러닝', '학습'];
  const aiCount = aiKeywords.filter(kw => prompt.includes(kw)).length;
  trendAlignment += aiCount * 12;
  
  // Personalization trend
  const personalizationKeywords = ['개인화', '맞춤', '취향', '추천', '큐레이션', '나만의'];
  const personalizationCount = personalizationKeywords.filter(kw => prompt.includes(kw)).length;
  trendAlignment += personalizationCount * 10;
  
  // Sustainability & ESG
  const sustainabilityKeywords = ['친환경', '지속가능', '재활용', '에코', '탄소', '그린'];
  if (sustainabilityKeywords.some(kw => prompt.includes(kw))) trendAlignment += 11;
  
  // Productivity & Efficiency (생산성)
  const productivityKeywords = ['생산성', '효율', '시간절약', '관리', '최적화'];
  if (productivityKeywords.some(kw => prompt.includes(kw))) trendAlignment += 10;
  
  // Mental health & Wellness
  const wellnessKeywords = ['멘탈', '정신건강', '웰빙', '명상', '���링', '케어', '건강'];
  if (wellnessKeywords.some(kw => prompt.includes(kw))) trendAlignment += 9;
  
  // MZ generation keywords
  const mzKeywords = ['플렉스', '가성비', '가심비', '요즘', 'MBTI', '미닝아웃'];
  if (mzKeywords.some(kw => prompt.includes(kw))) trendAlignment += 9;
  
  // Metaverse & Virtual (메타버스/가상)
  const metaverseKeywords = ['메타버스', '가상', 'VR', 'AR', '아바타', '디지털'];
  if (metaverseKeywords.some(kw => prompt.includes(kw))) trendAlignment += 8;
  
  // Creator economy
  const creatorKeywords = ['크리에이터', '콘텐츠', '창작', '제작', '인플루언서'];
  if (creatorKeywords.some(kw => prompt.includes(kw))) trendAlignment += 9;
  
  // Short-form content trend
  const shortFormKeywords = ['숏폼', '짧은', '요약', '한눈에', '빠르게', '간단'];
  if (shortFormKeywords.some(kw => prompt.includes(kw))) trendAlignment += 7;
  
  // Data-driven decision
  const dataKeywords = ['데이터', '분석', '통계', '인사이트', '지표'];
  if (dataKeywords.some(kw => prompt.includes(kw))) trendAlignment += 8;
  
  creativity = Math.min(100, Math.max(0, creativity));
  feasibility = Math.min(100, Math.max(0, feasibility));
  specificity = Math.min(100, Math.max(0, specificity));
  marketability = Math.min(100, Math.max(0, marketability));
  trendAlignment = Math.min(100, Math.max(0, trendAlignment));
  
  let total = Math.round((creativity + feasibility + specificity + marketability + trendAlignment) / 5);
  
  // Apply generous bonus for scores below 90
  if (total < 90 && total >= 60) {
    // Add bonus to make scoring more generous (5-8% boost)
    const bonus = Math.min(8, Math.round((90 - total) * 0.15));
    total = Math.min(89, total + bonus);
  } else if (total >= 90) {
    // Apply strict grading for idea scores 90+
    total = applyStrictIdeaGrading(total, prompt, creativity, feasibility, specificity, marketability, trendAlignment);
  }
  
  return {
    total,
    details: { creativity, feasibility, specificity, marketability, trendAlignment }
  };
}

// Strict grading specifically for idea scores 90+
function applyStrictIdeaGrading(score: number, prompt: string, creativity: number, feasibility: number, specificity: number, marketability: number, trendAlignment: number): number {
  let finalScore = score;
  let penalties = 0;
  
  // For 90+ idea scores, demand exceptional quality
  
  // Innovation depth check
  const innovationLevels = [
    prompt.includes('문제') && prompt.includes('해결'), // Problem identification
    prompt.includes('왜') || prompt.includes('어떻게'), // Critical thinking
    prompt.includes('차별화') || prompt.includes('독특'), // Differentiation
    prompt.includes('경험') || prompt.includes('가치'), // Value proposition
    prompt.includes('개선') || prompt.includes('혁신'), // Innovation intent
  ];
  const innovationScore = innovationLevels.filter(Boolean).length;
  if (innovationScore < 3) penalties += (3 - innovationScore) * 2.2;
  
  // Solution clarity
  const solutionClarity = [
    prompt.includes('기능') || prompt.includes('서비스'),
    prompt.includes('방법') || prompt.includes('절차'),
    prompt.includes('결과') || prompt.includes('효과'),
    prompt.includes('활용') || prompt.includes('적용'),
  ];
  const clarityScore = solutionClarity.filter(Boolean).length;
  if (clarityScore < 2) penalties += (2 - clarityScore) * 2.5;
  
  // Target audience understanding
  const audienceElements = [
    prompt.includes('사용자') || prompt.includes('고객') || prompt.includes('대상'),
    prompt.includes('필요') || prompt.includes('원하는') || prompt.includes('요구'),
    prompt.includes('상황') || prompt.includes('시나리오'),
  ];
  const audienceScore = audienceElements.filter(Boolean).length;
  if (audienceScore < 2) penalties += (2 - audienceScore) * 2.0;
  
  // For 95+ scores, demand near-perfection
  if (score >= 95) {
    // Must show deep understanding
    const deepThinking = [
      prompt.includes('분석') || prompt.includes('평가'),
      prompt.includes('고려') || prompt.includes('반영'),
      prompt.includes('최적화') || prompt.includes('개선'),
      prompt.includes('검증') || prompt.includes('확인'),
    ];
    const thinkingScore = deepThinking.filter(Boolean).length;
    if (thinkingScore < 2) penalties += (2 - thinkingScore) * 2.3;
    
    // Must have multi-dimensional approach
    const dimensions = [
      creativity >= 85,
      feasibility >= 85,
      specificity >= 85,
    ];
    const dimensionScore = dimensions.filter(Boolean).length;
    if (dimensionScore < 3) penalties += (3 - dimensionScore) * 2.5;
    
    // Must show contextual awareness
    const contextAwareness = [
      prompt.includes('배경') || prompt.includes('맥락'),
      prompt.includes('이유') || prompt.includes('목적'),
      prompt.includes('영향') || prompt.includes('효과'),
    ];
    const contextScore = contextAwareness.filter(Boolean).length;
    if (contextScore < 2) penalties += (2 - contextScore) * 1.8;
  }
  
  // For 98+ scores, near-impossible standards
  if (score >= 98) {
    // Must demonstrate mastery
    const masteryIndicators = [
      prompt.includes('종합') || prompt.includes('통합'),
      prompt.includes('전략') || prompt.includes('계획'),
      prompt.includes('단계별') || prompt.includes('체계적'),
      prompt.includes('측정') || prompt.includes('평가'),
    ];
    const masteryScore = masteryIndicators.filter(Boolean).length;
    if (masteryScore < 3) penalties += (3 - masteryScore) * 2.0;
    
    // Must show exceptional depth
    if (creativity < 90 || feasibility < 90 || specificity < 90) {
      penalties += 3.0;
    }
    
    // Must have unique insight
    const insightKeywords = ['통찰', '발견', '재해석', '관점', '시각'];
    const hasInsight = insightKeywords.some(kw => prompt.includes(kw));
    if (!hasInsight) penalties += 2.5;
  }
  
  finalScore = score - penalties;
  
  // Cap at 99.5 for ideas too
  if (finalScore > 99.5) finalScore = 99.5;
  
  // Return with decimal precision for 90+ scores
  if (finalScore >= 90) {
    return Math.round(finalScore * 10) / 10;
  }
  
  return Math.round(finalScore);
}

function evaluatePromptQuality(prompt: string): { total: number; details: any } {
  let roleClarity = 55;
  let structureQuality = 55;
  let outputSpecification = 55;
  
  // Role clarity
  const roleKeywords = ['역할', '당신은', '~로서', '~처럼', '전문가', '디자이너', '개발자', '기획자', '컨설턴트'];
  if (roleKeywords.some(kw => prompt.includes(kw))) roleClarity += 25;
  
  const actionKeywords = ['해줘', '만들어', '작성', '생성', '분석', '추천'];
  if (actionKeywords.some(kw => prompt.includes(kw))) roleClarity += 18;
  
  // Structure quality
  if (prompt.includes('\n') || prompt.includes('1.') || prompt.includes('-')) structureQuality += 22;
  if (prompt.includes('단계') || prompt.includes('절차') || prompt.includes('순서')) structureQuality += 18;
  
  const vagueWords = ['좀', '뭔가', '이런', '저런', '대충'];
  const vagueCount = vagueWords.filter(word => prompt.includes(word)).length;
  structureQuality -= vagueCount * 8;
  
  if (prompt.length > 150) structureQuality += 15;
  
  // Output specification
  const formatKeywords = ['형식', '포맷', '양식', '구조', '목록', '표', '정리'];
  const formatCount = formatKeywords.filter(kw => prompt.includes(kw)).length;
  outputSpecification += formatCount * 12;
  
  if (prompt.includes('구체적') || prompt.includes('자세히') || prompt.includes('상세히')) outputSpecification += 14;
  if (prompt.includes('예시') || prompt.includes('사례') || prompt.includes('예를 들어')) outputSpecification += 12;
  if (prompt.includes('조건') || prompt.includes('제약') || prompt.includes('규칙')) outputSpecification += 10;
  if (prompt.match(/\d+/)) outputSpecification += 10;
  
  roleClarity = Math.min(100, Math.max(0, roleClarity));
  structureQuality = Math.min(100, Math.max(0, structureQuality));
  outputSpecification = Math.min(100, Math.max(0, outputSpecification));
  
  let total = Math.round((roleClarity + structureQuality + outputSpecification) / 3);
  
  // Apply generous bonus for scores below 90
  if (total < 90 && total >= 60) {
    // Add bonus to make scoring more generous (5-8% boost)
    const bonus = Math.min(8, Math.round((90 - total) * 0.15));
    total = Math.min(89, total + bonus);
  }
  
  return {
    total,
    details: { roleClarity, structureQuality, outputSpecification }
  };
}

function analyzeStrengthsWeaknesses(prompt: string, ideaEval: any, promptEval: any): { strengths: string[]; weaknesses: string[] } {
  const allStrengths: { score: number; text: string }[] = [];
  const allWeaknesses: { score: number; text: string }[] = [];
  
  // Idea strengths/weaknesses
  if (ideaEval.details.creativity >= 70) {
    allStrengths.push({ score: ideaEval.details.creativity, text: '창의적이고 독창적인 아이디어 접근' });
  } else if (ideaEval.details.creativity < 50) {
    allWeaknesses.push({ score: 100 - ideaEval.details.creativity, text: '아이디어의 독창성이 부족합니다' });
  }
  
  if (ideaEval.details.feasibility >= 70) {
    allStrengths.push({ score: ideaEval.details.feasibility, text: '실현 가능성이 높은 현실적 제안' });
  } else if (ideaEval.details.feasibility < 50) {
    allWeaknesses.push({ score: 100 - ideaEval.details.feasibility, text: '실행 가능성을 높이는 구체적 방안 필요' });
  }
  
  if (ideaEval.details.specificity >= 70) {
    allStrengths.push({ score: ideaEval.details.specificity, text: '구체적이고 명확한 문제 정의' });
  } else if (ideaEval.details.specificity < 50) {
    allWeaknesses.push({ score: 100 - ideaEval.details.specificity, text: '주제에 대한 구체성과 세부 사항 보완 필요' });
  }
  
  if (ideaEval.details.marketability >= 70) {
    allStrengths.push({ score: ideaEval.details.marketability, text: '시장에서의 수요와 관련성이 높음' });
  } else if (ideaEval.details.marketability < 50) {
    allWeaknesses.push({ score: 100 - ideaEval.details.marketability, text: '시장에서의 수요와 관련성을 높이는 방안 필요' });
  }
  
  if (ideaEval.details.trendAlignment >= 70) {
    allStrengths.push({ score: ideaEval.details.trendAlignment, text: '최신 트렌드와 일치하는 아이디어' });
  } else if (ideaEval.details.trendAlignment < 50) {
    allWeaknesses.push({ score: 100 - ideaEval.details.trendAlignment, text: '최신 트렌드와의 일치성을 높이는 방안 필요' });
  }
  
  // Prompt strengths/weaknesses
  if (promptEval.details.roleClarity >= 70) {
    allStrengths.push({ score: promptEval.details.roleClarity, text: 'AI의 역할과 목적이 명확하게 정의됨' });
  } else if (promptEval.details.roleClarity < 50) {
    allWeaknesses.push({ score: 100 - promptEval.details.roleClarity, text: 'AI에게 요구하는 역할을 더 명확히 제시하세요' });
  }
  
  if (promptEval.details.structureQuality >= 70) {
    allStrengths.push({ score: promptEval.details.structureQuality, text: '체계적이고 논리적인 프롬프트 구조' });
  } else if (promptEval.details.structureQuality < 50) {
    allWeaknesses.push({ score: 100 - promptEval.details.structureQuality, text: '프롬프트 구조와 논리성 개선 필요' });
  }
  
  if (promptEval.details.outputSpecification >= 70) {
    allStrengths.push({ score: promptEval.details.outputSpecification, text: '출력 형식과 조건이 구체적으로 명시됨' });
  } else if (promptEval.details.outputSpecification < 50) {
    allWeaknesses.push({ score: 100 - promptEval.details.outputSpecification, text: '원하는 출력 형식과 조건을 더 상세히 작성하세요' });
  }
  
  // Length-based feedback
  if (prompt.length > 200) {
    allStrengths.push({ score: 75, text: '충분한 분량으로 상세한 설명 제공' });
  }
  
  // Sort by score (highest first for strengths, highest gap for weaknesses)
  allStrengths.sort((a, b) => b.score - a.score);
  allWeaknesses.sort((a, b) => b.score - a.score);
  
  // Return exactly 2 strengths and 2 weaknesses
  const strengths = allStrengths.slice(0, 2).map(s => s.text);
  const weaknesses = allWeaknesses.slice(0, 2).map(w => w.text);
  
  // If we don't have 2 strengths, add generic ones
  while (strengths.length < 2) {
    if (strengths.length === 0) {
      strengths.push('주제를 이해하고 접근하려는 시도가 보입니다');
    } else {
      strengths.push('프롬프트 작성에 대한 기본 이해가 있습니다');
    }
  }
  
  // If we don't have 2 weaknesses, add generic ones
  while (weaknesses.length < 2) {
    if (weaknesses.length === 0) {
      weaknesses.push('더 구체적인 설명을 추가하면 좋겠습니다');
    } else {
      weaknesses.push('실행 가능한 세부 방안을 보완해보세요');
    }
  }
  
  return { strengths, weaknesses };
}

function generateFeedback(ideaScore: number, promptScore: number, prompt: string): string {
  const avgScore = (ideaScore + promptScore) / 2;
  const parts: string[] = [];

  // --- 1. Overall impression ---
  if (avgScore >= 80) {
    parts.push('전반적으로 매우 높은 수준의 프롬프트입니다.');
  } else if (avgScore >= 65) {
    parts.push('기본기가 갖춰진 프롬프트이나, 몇 가지 보완 포인트가 있습니다.');
  } else if (avgScore >= 50) {
    parts.push('핵심 아이디어는 잡았지만, 전달 방식에서 아쉬움이 남습니다.');
  } else {
    parts.push('프롬프트의 전반적인 방향과 구조 모두 재검토가 필요합니다.');
  }

  // --- 2. Idea analysis ---
  if (ideaScore >= 80) {
    parts.push('아이디어 측면에서는 주제를 깊이 있게 해석하고 독창적인 시각을 보여주고 있습니다. 문제 정의부터 해결 방향까지 논리적으로 연결되어 있어 실제 서비스화했을 때도 경쟁력이 있을 것으로 보입니다.');
  } else if (ideaScore >= 65) {
    if (prompt.includes('문제') || prompt.includes('해결')) {
      parts.push('문제 인식은 뚜렷하나, 해결 방안이 좀 더 구체적이면 좋겠습니다. 아이디어가 실제로 구현되었을 때 사용자가 어떤 가치를 느낄지에 대한 설명을 추가하면 설득력이 크게 올라갈 것입니다.');
    } else {
      parts.push('아이디어에 잠재력이 있지만, "왜 이것이 필요한가"에 대한 근거가 부족합니다. 대상 사용자의 불편함이나 니즈를 먼저 정의하고, 그것을 어떻게 해결하는지 흐름을 잡아보세요.');
    }
  } else if (ideaScore >= 50) {
    parts.push('아이디어가 다소 일반적인 수준에 머물고 있습니다. 비슷한 서비스나 솔루션이 이미 존재하는지 차별점은 무엇인지 고민해보세요. "기존에 없는 가치"를 한 줄로 설명할 수 있다면 좋은 아이디어의 첫걸음입니다.');
  } else {
    parts.push('아이디어가 주제와의 연결성이 약하거나, 추상적인 단어 나열에 그치고 있습니다. 주제의 핵심 키워드를 다시 읽고, "누구에게", "어떤 상황에서", "무슨 문제를" 해결하는지 구체적으로 써보세요.');
  }

  // --- 3. Prompt structure analysis ---
  if (promptScore >= 80) {
    parts.push('프롬프트 구조도 우수합니다. AI에게 역할을 부여하고, 단계별로 지시하며, 출력 형식까지 명시한 점이 인상적입니다. 이 수준이면 실제 GPT에 입력해도 바로 양질의 결과를 기대할 수 있습니다.');
  } else if (promptScore >= 65) {
    const hasRole = prompt.includes('역할') || prompt.includes('당신은') || prompt.includes('전문가');
    const hasFormat = prompt.includes('형식') || prompt.includes('포맷') || prompt.includes('목록') || prompt.includes('표');
    if (!hasRole && !hasFormat) {
      parts.push('프롬프트 구조에서 가장 아쉬운 점은 AI의 역할 설정과 출력 형식이 빠져있다는 것입니다. "당신은 ~분야 전문가입니다"로 시작하고, "~형식으로 정리해줘"라고 마무리하면 결과의 질이 크게 달라집니다.');
    } else if (!hasRole) {
      parts.push('출력 조건은 어느 정도 갖추었으나, AI에게 어떤 관점에서 답해야 하는지 역할을 부여하지 않았습니다. "당신은 ~입니다" 한 문장만 추가해도 AI의 답변 톤과 깊이가 완전히 달라집니다.');
    } else if (!hasFormat) {
      parts.push('역할 설정은 잘 되어있으나, AI가 어떤 형태로 결과물을 만들어야 하는지 불분명합니다. "표로 정리해줘", "3가지 옵션으로 제시해줘" 같은 출력 형식 지정을 추가해보세요.');
    } else {
      parts.push('프롬프트 작성 기술이 양호합니다. 다만 조건이나 제약사항을 추가하면 AI가 더 정확한 결과를 만들어낼 수 있습니다. 예를 들어 "~는 제외하고", "~를 반드시 포함해서" 같은 구체적 조건을 넣어보세요.');
    }
  } else if (promptScore >= 50) {
    parts.push('프롬프트가 "~해줘"라는 단순 요청 수준에 가깝습니다. 좋은 프롬프트는 세 가지를 갖춰야 합니다: (1) AI의 역할/관점 설정, (2) 단계별 지시사항, (3) 원하는 출력의 형식과 조건. 이 세 가지를 의식하며 다시 작성해보세요.');
  } else {
    parts.push('프롬프트가 너무 짧거나 모호하여 AI가 의도를 파악하기 어렵습니다. 최소한 "누구(역할)"에게 "무엇(과제)"을 "어떻게(형식)" 해달라는 세 요소를 담아야 합니다. 한 줄짜리 질문보다는 맥락과 조건을 함께 제시해보세요.');
  }

  // --- 4. Specific actionable tip based on gap ---
  const gap = Math.abs(ideaScore - promptScore);
  if (gap >= 20) {
    if (ideaScore > promptScore) {
      parts.push('[Tip] 아이디어 감각은 뛰어나니, 프롬프트 엔지니어링 기법(역할 부여, 단계 분리, 출력 형식 지정)을 연습하면 점수가 크게 오를 수 있습니다.');
    } else {
      parts.push('[Tip] 프롬프트 작성 기술은 좋으니, 주제를 더 깊이 분석하고 차별화된 아이디어를 구상하는 데 시간을 투자해보세요.');
    }
  } else if (avgScore < 65) {
    parts.push('[Tip] 다음 라운드에서는 프롬프트를 쓰기 전에 30초만 "이 주제의 핵심 문제가 뭘까?"를 먼저 생각해보세요. 그 한 문장이 전체 프롬프트의 방향을 잡아줍니다.');
  } else if (avgScore >= 80) {
    const hasExample = prompt.includes('예시') || prompt.includes('사례') || prompt.includes('예를 들어');
    const hasNegative = prompt.includes('제외') || prompt.includes('피해') || prompt.includes('않도록');
    if (!hasExample) {
      parts.push('[Tip] 이미 훌륭하지만, 구체적인 예시("예를 들어 ~와 같은")를 1-2개 추가하면 AI가 의도를 더 정확히 파악합니다.');
    } else if (!hasNegative) {
      parts.push('[Tip] 거의 완벽에 가까운 프롬프트입니다. "~는 제외해줘"처럼 네거티브 조건을 추가하면 불필요한 결과를 사전에 걸러낼 수 있습니다.');
    } else {
      parts.push('[Tip] 매우 완성도 높은 프롬프트입니다. 마지막으로 "결과를 자기 검증하고 부족한 부분을 보완해줘"라는 메타 지시를 추가해보세요.');
    }
  }

  return parts.join(' ');
}
