-- Add prompt_text column to game_scores table
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS prompt_text TEXT;
