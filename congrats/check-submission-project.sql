-- Check if the submission has a valid vetted_project_id
-- Run this in Congrats Supabase SQL Editor

SELECT 
  s.id as submission_id,
  s.opportunity_id,
  s.vetted_project_id,
  s.status,
  s.submitted_at,
  vp.vetted_project_id as linked_project_id,
  vp.project_title
FROM audition_submissions s
LEFT JOIN vetted_projects vp ON vp.id = s.opportunity_id OR vp.vetted_project_id = s.vetted_project_id
WHERE s.id = '81d388a1-1f2e-409a-8acd-b2d6a9739ebd';
