import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== ENV CHECK ===')
console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
console.log('SERVICE_ROLE_KEY:', serviceKey ? 'SET (' + serviceKey.slice(0, 10) + '...)' : 'MISSING')
console.log('ANON_KEY:', anonKey ? 'SET (' + anonKey.slice(0, 10) + '...)' : 'MISSING')

// Test with service role key
console.log('\n=== SERVICE ROLE KEY TEST ===')
const supaService = createClient(supabaseUrl, serviceKey)
const { data: serviceData, error: serviceErr } = await supaService
  .from('game_scores')
  .select('session_id, phone_number, score')
  .order('score', { ascending: false })
  .limit(5)

console.log('Error:', serviceErr)
console.log('Data count:', serviceData?.length)
console.log('First 3:', serviceData?.slice(0, 3))

// Test with anon key
console.log('\n=== ANON KEY TEST ===')
const supaAnon = createClient(supabaseUrl, anonKey)
const { data: anonData, error: anonErr } = await supaAnon
  .from('game_scores')
  .select('session_id, phone_number, score')
  .order('score', { ascending: false })
  .limit(5)

console.log('Error:', anonErr)
console.log('Data count:', anonData?.length)
console.log('First 3:', anonData?.slice(0, 3))

// Check RLS
console.log('\n=== RLS CHECK ===')
const { data: rlsData } = await supaService.rpc('to_regclass', { name: 'game_scores' }).single()
console.log('Table exists check:', rlsData)
