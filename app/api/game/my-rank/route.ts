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
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get all scores ordered by score desc
    const { data: allScores, error } = await supabase
      .from('game_scores')
      .select('phone_number, score')
      .order('score', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!allScores || allScores.length === 0) {
      return NextResponse.json({ found: false, message: '아직 참가 기록이 없습니다.' })
    }

    // Deduplicate: best score per phone
    const bestByPhone = new Map<string, number>()
    for (const row of allScores) {
      const key = row.phone_number || 'unknown'
      const existing = bestByPhone.get(key)
      if (!existing || row.score > existing) {
        bestByPhone.set(key, row.score)
      }
    }

    // Sort
    const sorted = Array.from(bestByPhone.entries()).sort((a, b) => b[1] - a[1])
    const totalPlayers = sorted.length

    // Find my rank
    const myEntry = sorted.findIndex(([p]) => p === phone)
    if (myEntry === -1) {
      return NextResponse.json({ found: false, message: '해당 전화번호로 참가한 기록이 없습니다.' })
    }

    const myRank = myEntry + 1
    const myScore = sorted[myEntry][1]
    const grade = getGrade(myScore)

    return NextResponse.json({
      found: true,
      rank: myRank,
      score: myScore,
      grade,
      total_players: totalPlayers,
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
