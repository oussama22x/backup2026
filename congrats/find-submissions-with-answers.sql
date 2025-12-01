-- Find submissions that actually have audio answers
-- Run this in Congrats Supabase SQL Editor

SELECT 
  s.id as submission_id,
  s.user_id,
  s.opportunity_id,
  s.status,
  s.submitted_at,
  CASE 
    WHEN s.audio_urls IS NOT NULL THEN jsonb_array_length(s.audio_urls)
    ELSE 0 
  END as num_answers,
  vp.vetted_project_id,
  vp.project_title
FROM audition_submissions s
LEFT JOIN vetted_projects vp ON vp.id = s.opportunity_id
WHERE s.audio_urls IS NOT NULL 
  AND jsonb_array_length(s.audio_urls) > 0
ORDER BY s.submitted_at DESC
LIMIT 10;
