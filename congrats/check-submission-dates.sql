-- Check what submissions exist and their dates
SELECT 
    id,
    user_id,
    opportunity_id,
    status,
    submitted_at,
    DATE(submitted_at) as submission_date
FROM audition_submissions
ORDER BY submitted_at DESC
LIMIT 20;
