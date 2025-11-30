-- ============================================
-- Check audio_url values in audition_answers
-- Run this in YOUR Congrats AI database
-- ============================================

-- Check what's in the audio_url field for this submission
SELECT 
  id,
  question_id,
  question_text,
  audio_url,
  user_id,
  opportunity_id
FROM audition_answers
WHERE opportunity_id = 'hr-trainee'
  AND user_id = (
    SELECT user_id 
    FROM audition_submissions 
    WHERE id = 'ea463a97-663b-40ae-a4c4-1ee670eefa63'
  )
LIMIT 5;

-- This will show you what's stored in the audio_url field
-- Expected format: "user_id/submission_id/question_0.webm"
-- or a full URL: "https://..."
