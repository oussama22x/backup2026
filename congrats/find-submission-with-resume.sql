-- Find a submission where the user has a resume
-- Corrected to use talent_files.created_at for ordering
SELECT 
    s.id as submission_id,
    s.user_id,
    s.opportunity_id,
    tf.file_url as resume_url,
    tf.created_at as resume_date
FROM audition_submissions s
JOIN talent_files tf ON s.user_id = tf.user_id
WHERE tf.file_type = 'resume'
ORDER BY tf.created_at DESC
LIMIT 5;
