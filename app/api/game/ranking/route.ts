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

    // Fetch all scores, ordered by score descending
    const { data: allScores, error } = await supabase
      .from('game_scores')
      .select('session_id, phone_number, score')
      .order('score', { ascending: false })

    console.log('[v0] Ranking query - error:', error, 'count:', allScores?.length, 'sessionId:', sessionId)

    if (error) {
      console.error('[v0] Ranking DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!allScores || allScores.length === 0) {
      return NextResponse.json({
        rankings: [],
        my_rank: null,
        total_players: 0,
      })
    }

    // Deduplicate by phone_number (keep highest score per player)
    const bestByPhone = new Map<string, { session_id: string; score: number }>()
    for (const row of allScores) {
      const key = row.phone_number || row.session_id // fallback to session_id if no phone
      const existing = bestByPhone.get(key)
      if (!existing || row.score > existing.score) {
        bestByPhone.set(key, {
          session_id: row.session_id,
          score: row.score,
        })
      }
    }

    // Sort and assign ranks
    const sorted = Array.from(bestByPhone.values()).sort((a, b) => b.score - a.score)

    let myRank: number | null = null
    const rankings = sorted.map((entry, idx) => {
      const rank = idx + 1
      const isMe = sessionId ? entry.session_id === sessionId : false
      if (isMe) myRank = rank

      return {
        rank,
        score: entry.score,
        grade: getGrade(entry.score),
        isMe,
      }
    })

    return NextResponse.json({
      rankings,
      my_rank: myRank,
      total_players: rankings.length,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function getGrade(score: number): string {
  if (score >= 95) return 'S+'
  if (score >= 90) return 'S'
  if (score >= 85) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}
