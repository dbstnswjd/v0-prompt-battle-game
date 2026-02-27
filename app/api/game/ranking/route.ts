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

    // Get all scores ordered by score descending
    // For each phone_number, only take the best (max) score
    const { data: allScores, error } = await supabase
      .from('game_scores')
      .select('session_id, phone_number, score')
      .order('score', { ascending: false })

    if (error) {
      console.error('[v0] Failed to fetch rankings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduplicate: keep only the highest score per phone_number
    const bestByPhone = new Map<string, { session_id: string; score: number }>()
    for (const row of allScores || []) {
      const existing = bestByPhone.get(row.phone_number)
      if (!existing || row.score > existing.score) {
        bestByPhone.set(row.phone_number, {
          session_id: row.session_id,
          score: row.score,
        })
      }
    }

    // Sort by score descending and assign ranks
    const sorted = Array.from(bestByPhone.entries())
      .map(([, val]) => val)
      .sort((a, b) => b.score - a.score)

    let myRank: number | null = null
    const rankings = sorted.map((entry, idx) => {
      const rank = idx + 1
      const isMe = entry.session_id === sessionId
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
    console.error('[v0] Ranking API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
