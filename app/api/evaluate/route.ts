import { generateText, Output } from 'ai'
import { z } from 'zod'

const evaluationSchema = z.object({
  totalScore: z.number().describe('4가지 평가 기준의 가중 평균 (0-100)'),
  creativityScore: z.number().describe('창의성 점수 (0-100): 아이디어의 독창성과 창의적 접근'),
  feasibilityScore: z.number().describe('실현 가능성 점수 (0-100): 현실적으로 구현/실행 가능한 정도'),
  profitabilityScore: z.number().describe('수익성 점수 (0-100): 비즈니스 잠재력과 수익화 가능성'),
  structureScore: z.number().describe('프롬프트 구조 점수 (0-100): 프롬프트의 구조적 완성도, 명확성, 구체성'),
  feedback: z.string().describe('전체적인 AI 총평 (한국어, 2-3문장)'),
  strengths: z.array(z.string()).describe('프롬프트의 강점 목록 (한국어, 각각 1문장, 2-4개)'),
  weaknesses: z.array(z.string()).describe('프롬프트의 개선점 목록 (한국어, 각각 1문장, 2-4개)'),
})

export async function POST(req: Request) {
  try {
    const { prompt, topic } = await req.json()

    if (!prompt || !topic) {
      return Response.json({ error: '프롬프트와 주제가 필요합니다.' }, { status: 400 })
    }

    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({ schema: evaluationSchema }),
      system: `당신은 AI 프롬프트 배틀 게임의 심사위원입니다. 참가자가 주어진 주제에 대해 작성한 프롬프트를 냉정하고 공정하게 평가합니다.

평가 기준 (각 0-100점):

1. 창의성 (creativityScore): 
   - 아이디어가 얼마나 독창적이고 참신한가?
   - 주제를 해석하는 방식이 흔하지 않은 접근인가?
   - 새로운 관점이나 의외의 연결고리가 있는가?

2. 실현 가능성 (feasibilityScore):
   - 이 프롬프트로 실제로 유용한 결과물을 만들 수 있는가?
   - AI가 이 지시를 실행할 수 있는가?
   - 현실적으로 구현 가능한 서비스/제품/솔루션인가?

3. 수익성 (profitabilityScore):
   - 비즈니스 잠재력이 있는가?
   - 수익화 가능한 모델이 보이는가?
   - 시장 수요나 대중성이 있는가?

4. 프롬프트 구조 (structureScore):
   - 역할(Role)이 명확하게 정의되어 있는가?
   - 출력 형식과 조건이 구체적인가?
   - 불필요한 모호성 없이 잘 구조화되어 있는가?
   - AI가 바로 실행할 수 있을 만큼 명확한가?

totalScore는 4가지 점수의 가중 평균입니다: 창의성 25%, 실현 가능성 25%, 수익성 20%, 프롬프트 구조 30%.

모든 응답은 한국어로 작성하세요. 점수는 냉정하게, 피드백은 건설적으로 작성하세요.
빈 프롬프트나 의미없는 내용은 매우 낮은 점수를 부여하세요.`,
      prompt: `주제: ${topic}

참가자의 프롬프트:
${prompt}

위 프롬프트를 4가지 기준(창의성, 실현 가능성, 수익성, 프롬프트 구조)으로 평가해주세요.`,
    })

    if (!output) {
      return Response.json({ error: '평가 생성에 실패했습니다.' }, { status: 500 })
    }

    return Response.json(output)
  } catch (error) {
    console.error('Evaluation error:', error)
    return Response.json(
      { error: '평가 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
