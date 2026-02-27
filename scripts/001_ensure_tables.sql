-- Ensure game_sessions table exists
CREATE TABLE IF NOT EXISTS game_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure game_scores table exists
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(session_id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  round_number INT NOT NULL DEFAULT 1,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for ranking queries (best score per session)
CREATE INDEX IF NOT EXISTS idx_game_scores_score_desc ON game_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_session ON game_scores (session_id);

-- Disable RLS since this is a public game without auth
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores DISABLE ROW LEVEL SECURITY;
