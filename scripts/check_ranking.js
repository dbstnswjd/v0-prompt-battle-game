import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

async function check() {
  // Check game_scores table
  const { data, error, count } = await supabase
    .from('game_scores')
    .select('*', { count: 'exact' })
    .order('score', { ascending: false })
    .limit(10)

  console.log('--- game_scores table ---')
  console.log('Error:', error)
  console.log('Count:', count)
  console.log('Data:', JSON.stringify(data, null, 2))

  // Check game_sessions table
  const { data: sessions, error: sessErr } = await supabase
    .from('game_sessions')
    .select('*')
    .limit(5)

  console.log('\n--- game_sessions table ---')
  console.log('Error:', sessErr)
  console.log('Data:', JSON.stringify(sessions, null, 2))
}

check()
