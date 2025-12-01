-- Fetch candidate details for submission 971f7956-28a1-45c7-9afa-f3fa68ae27c7
SELECT 
    s.id as submission_id,
    s.user_id,
    p.first_name,
    p.last_name,
    u.email
FROM audition_submissions s
LEFT JOIN talent_profiles p ON s.user_id = p.user_id
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE s.id = '971f7956-28a1-45c7-9afa-f3fa68ae27c7';
