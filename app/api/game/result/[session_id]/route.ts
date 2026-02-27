import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('game_scores')
      .select('score, created_at')
      .eq('session_id', session_id)
      .order('score', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    // Get rank info
    const { data: allScores } = await supabase
      .from('game_scores')
      .select('session_id, phone_number, score')
      .order('score', { ascending: false })

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

    const sorted = Array.from(bestByPhone.entries())
      .map(([, val]) => val)
      .sort((a, b) => b.score - a.score)

    let rank: number | null = null
    sorted.forEach((entry, idx) => {
      if (entry.session_id === session_id) {
        rank = idx + 1
      }
    })

    return NextResponse.json({
      score: data.score,
      rank,
      totalPlayers: sorted.length,
    })
  } catch (e) {
    console.error('[v0] Result API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
