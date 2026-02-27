import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // Try to add the column via rpc/raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    query: "ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS prompt_text TEXT"
  })
  
  if (error) {
    console.log('rpc exec_sql failed (expected if function doesnt exist):', error.message)
    
    // Fallback: test if column already exists by inserting/selecting
    const { data, error: selectError } = await supabase
      .from('game_scores')
      .select('prompt_text')
      .limit(1)
    
    if (selectError) {
      console.log('prompt_text column does NOT exist yet. Error:', selectError.message)
      console.log('')
      console.log('Please run this SQL manually in Supabase SQL Editor:')
      console.log('ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS prompt_text TEXT;')
    } else {
      console.log('prompt_text column already exists! Data sample:', data)
    }
  } else {
    console.log('Column added successfully via rpc')
  }
}

main()
