-- Query to check for submissions with profile data
-- Run this in Congrats Supabase SQL Editor

SELECT 
  s.id as submission_id,
  s.user_id,
  s.vetted_project_id,
  s.submitted_at,
  -- Profile data fields we're testing
  tp.years_of_experience,
  tp.desired_salary_min,
  tp.desired_salary_max,
  tp.availability_date,
  tp.github_url,
  tp.desired_role,
  tp.location,
  tp.linkedin_url,
  tp.portfolio_url,
  SUBSTRING(tp.bio, 1, 50) as bio_preview,
  -- Check if profile exists
  CASE 
    WHEN tp.id IS NULL THEN '❌ No profile'
    WHEN tp.years_of_experience IS NOT NULL 
         AND tp.desired_salary_min IS NOT NULL 
         AND tp.desired_role IS NOT NULL THEN '✅ Good data'
    ELSE '⚠️ Partial data'
  END as data_status
FROM audition_submissions s
LEFT JOIN talent_profiles tp ON tp.user_id = s.user_id
WHERE s.audio_urls IS NOT NULL
ORDER BY s.submitted_at DESC
LIMIT 10;
