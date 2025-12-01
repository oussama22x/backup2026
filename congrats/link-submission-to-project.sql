-- Fix old submissions by linking them to a vetted project
-- Run this in Congrats Supabase SQL Editor

-- First, let's see what we have
SELECT 
  s.id as submission_id,
  s.user_id,
  s.opportunity_id,
  s.status,
  s.submitted_at,
  'No project linked' as issue
FROM audition_submissions s
LEFT JOIN vetted_projects vp ON vp.id = s.opportunity_id
WHERE s.id = '81d388a1-1f2e-409a-8acd-b2d6a9739ebd'
  AND vp.id IS NULL;

-- Check available vetted_projects
SELECT 
  id,
  vetted_project_id,
  project_title,
  recruiter_email,
  created_at
FROM vetted_projects
ORDER BY created_at DESC
LIMIT 5;

-- Link the submission to the test project we created earlier
-- Replace 'PROJECT_UUID_HERE' with the actual project id from above query
UPDATE audition_submissions 
SET opportunity_id = (
  SELECT id 
  FROM vetted_projects 
  WHERE vetted_project_id = '2cbdf732-54dc-4511-aaa4-b745193fb0ff'
  LIMIT 1
)
WHERE id = '81d388a1-1f2e-409a-8acd-b2d6a9739ebd';

-- Verify the link
SELECT 
  s.id as submission_id,
  s.opportunity_id,
  vp.vetted_project_id,
  vp.project_title,
  'Linked!' as status
FROM audition_submissions s
JOIN vetted_projects vp ON vp.id = s.opportunity_id
WHERE s.id = '81d388a1-1f2e-409a-8acd-b2d6a9739ebd';
