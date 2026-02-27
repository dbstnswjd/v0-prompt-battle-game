import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: Request) {
  try {
    const { session_id, phone_number, round_number, score, prompt_text } = await request.json()

    if (!session_id || !phone_number || !round_number || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('game_scores')
      .insert({ session_id, phone_number, round_number, score, prompt_text: prompt_text || null })
      .select()

    if (error) {
      console.error('[v0] Failed to save score:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('[v0] Score API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
