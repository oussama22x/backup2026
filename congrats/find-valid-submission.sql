-- ============================================
-- Find Valid Submissions for Testing
-- Run this in YOUR Congrats AI database
-- ============================================

-- Find submissions with valid users and audio files
SELECT 
  s.id as submission_id,
  s.user_id,
  s.opportunity_id,
  u.email as user_email,
  o.title as opportunity_title,
  jsonb_array_length(s.audio_urls) as audio_count
FROM audition_submissions s
JOIN auth.users u ON s.user_id::text = u.id::text
JOIN opportunities o ON s.opportunity_id::text = o.id::text
WHERE s.audio_urls IS NOT NULL 
  AND jsonb_array_length(s.audio_urls) > 0
LIMIT 5;

-- This query ensures:
-- ✅ Submission exists
-- ✅ User exists in auth.users
-- ✅ Opportunity exists
-- ✅ Has audio files

-- Copy the 'submission_id' from the results to test with
