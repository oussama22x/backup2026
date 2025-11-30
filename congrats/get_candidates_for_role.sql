-- Fetch all candidates who applied to the specific role
-- Opportunity ID: bd37cd69-6d0d-4794-95cc-0fc001c4a96d
-- NOTE: We join auth.users to get the email, as it is not in talent_profiles.

SELECT 
    s.id as submission_id,
    s.submitted_at,
    p.first_name,
    p.last_name,
    u.email, -- Fetching email from auth.users
    p.linkedin_url
FROM audition_submissions s
JOIN talent_profiles p ON s.user_id = p.user_id
JOIN auth.users u ON s.user_id = u.id
WHERE s.opportunity_id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d'
ORDER BY s.submitted_at DESC;
