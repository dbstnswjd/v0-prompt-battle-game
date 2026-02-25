import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use supabase-js directly on server side (no auth needed for this game)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: Request) {
  try {
    const { phone_number } = await request.json()

    if (!phone_number) {
      return NextResponse.json({ error: 'phone_number is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({ phone_number })
      .select('session_id')
      .single()

    if (error) {
      console.error('[v0] Failed to create session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session_id: data.session_id })
  } catch (e) {
    console.error('[v0] Session API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
