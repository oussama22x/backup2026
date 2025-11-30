-- ============================================
-- Inspect Audio URLs Structure
-- Run this in YOUR Congrats AI database
-- ============================================

-- Check the audio_urls structure for your submission
SELECT 
  id,
  audio_urls,
  jsonb_array_length(audio_urls) as audio_count,
  audio_urls->0 as first_audio_entry
FROM audition_submissions
WHERE id = 'ea463a97-663b-40ae-a4c4-1ee670eefa63';

-- This will show you:
-- 1. The full audio_urls JSONB array
-- 2. How many audio entries there are
-- 3. What the first audio entry looks like

-- Expected format should be:
-- [
--   {
--     "question_index": 0,
--     "file_path": "user_id/submission_id/question_0.webm",
--     "audio_url": "https://...",  (optional)
--     "transcript": "..."  (optional)
--   }
-- ]
