import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

async function run() {
  // Test if game_sessions table exists by trying a select
  const { error: sessErr } = await supabase.from('game_sessions').select('session_id').limit(1)
  
  if (sessErr && sessErr.message.includes('does not exist')) {
    console.log('Tables do not exist yet. Creating via SQL...')
    
    const { error: sqlErr } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS game_sessions (
          session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS game_scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES game_sessions(session_id) ON DELETE CASCADE,
          phone_number TEXT NOT NULL,
          round_number INT NOT NULL DEFAULT 1,
          score INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_game_scores_score_desc ON game_scores (score DESC);
        CREATE INDEX IF NOT EXISTS idx_game_scores_session ON game_scores (session_id);
      `
    })
    
    if (sqlErr) {
      console.log('RPC not available, tables may need manual creation:', sqlErr.message)
    } else {
      console.log('Tables created successfully!')
    }
  } else if (sessErr) {
    console.log('Error checking tables:', sessErr.message)
  } else {
    console.log('game_sessions table already exists.')
  }

  // Test game_scores table
  const { error: scoreErr } = await supabase.from('game_scores').select('id').limit(1)
  if (scoreErr) {
    console.log('game_scores table status:', scoreErr.message)
  } else {
    console.log('game_scores table already exists.')
  }

  // Test ranking query
  const { data: rankData, error: rankErr } = await supabase
    .from('game_scores')
    .select('score, created_at')
    .order('score', { ascending: false })
    .limit(5)
    
  console.log('Ranking test:', rankErr ? rankErr.message : `Found ${rankData?.length || 0} scores`)
}

run().catch(console.error)
