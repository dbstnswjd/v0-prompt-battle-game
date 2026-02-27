import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    const supabase = getSupabase()

    // Get all players' best scores (max score per session)
    const { data: allScores, error: allError } = await supabase
      .from('game_scores')
      .select('session_id, phone_number, score')
      .order('score', { ascending: false })

    if (allError) {
      console.error('[v0] Failed to fetch rankings:', allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Build a map of session_id -> best score
    const bestScoreMap = new Map<string, { session_id: string; phone_number: string; score: number }>()

    for (const row of allScores || []) {
      const existing = bestScoreMap.get(row.session_id)
      if (!existing || row.score > existing.score) {
        bestScoreMap.set(row.session_id, {
          session_id: row.session_id,
          phone_number: row.phone_number,
          score: row.score,
        })
      }
    }

    // Sort by best score descending
    const ranked = Array.from(bestScoreMap.values()).sort((a, b) => b.score - a.score)

    // Find current player's rank
    let myRank: number | null = null
    let myScore: number | null = null

    if (sessionId) {
      const idx = ranked.findIndex((r) => r.session_id === sessionId)
      if (idx !== -1) {
        myRank = idx + 1
        myScore = ranked[idx].score
      }
    }

    // Top 10 leaderboard with random nicknames
    const top10 = ranked.slice(0, 10).map((r, idx) => {
      const isMe = sessionId ? r.session_id === sessionId : false
      return {
        rank: idx + 1,
        name: isMe ? '나' : getRandomNickname(idx, r.session_id),
        score: r.score,
        isMe,
      }
    })

    // Percentile (top X%)
    const totalPlayers = ranked.length
    const percentile = myRank ? Math.round((myRank / totalPlayers) * 100) : null

    return NextResponse.json({
      myRank,
      myScore,
      totalPlayers,
      percentile,
      top10,
    })
  } catch (e) {
    console.error('[v0] Ranking API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const NICKNAMES = [
  '너굴너굴', '뚝딱뚝딱', '반짝반짝', '두근두근', '살랑살랑',
  '몽글몽글', '포근포근', '졸졸졸', '두리번두리번', '쏙쏙',
  '알쏭달쏭', '뿌듯뿌듯', '토닥토닥', '싱글벙글', '후루룩',
  '쓱쓱싹싹', '아기자기', '꼬물꼬물', '반들반들', '폴짝폴짝',
  '슝슝', '콩닥콩닥', '꾸벅꾸벅', '보슬보슬', '사르르',
  '나풀나풀', '빙글빙글', '소곤소곤', '또각또각', '찰랑찰랑',
]

function getRandomNickname(index: number, sessionId: string): string {
  // Use a simple hash of session_id to consistently assign the same nickname per player
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash) + sessionId.charCodeAt(i)
    hash |= 0
  }
  const nicknameIdx = Math.abs(hash + index) % NICKNAMES.length
  return NICKNAMES[nicknameIdx]
}
