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

    // Top 10 leaderboard with masked phone numbers
    const top10 = ranked.slice(0, 10).map((r, idx) => ({
      rank: idx + 1,
      phone: maskPhone(r.phone_number),
      score: r.score,
      isMe: sessionId ? r.session_id === sessionId : false,
    }))

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

function maskPhone(phone: string): string {
  // Mask middle digits: 010-1234-5678 -> 010-****-5678
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length >= 8) {
    const prefix = cleaned.slice(0, 3)
    const suffix = cleaned.slice(-4)
    return `${prefix}-****-${suffix}`
  }
  return phone.slice(0, 3) + '****'
}
