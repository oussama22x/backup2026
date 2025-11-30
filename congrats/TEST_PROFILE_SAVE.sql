-- Test Profile Save - Run this after filling out profile wizard
-- Replace 'your-email@example.com' with your actual email

-- 1. Find your user
SELECT 
    u.id as user_id,
    u.email,
    au.id as app_user_id,
    au.role
FROM auth.users u
LEFT JOIN public.app_user au ON u.id = au.id
WHERE u.email = 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL

-- 2. Check if profile exists for your user
-- Replace 'your-user-id' with the user_id from step 1
SELECT 
    id,
    user_id,
    first_name,
    last_name,
    linkedin_url,
    wizard_step,
    onboarding_completed,
    is_profile_complete,
    experience_level,
    desired_roles,
    work_arrangements,
    location_preferences,
    current_city,
    current_country,
    start_timing,
    desired_salary_min,
    desired_salary_max,
    created_at,
    updated_at
FROM public.talent_profiles
WHERE user_id = 'your-user-id-here'; -- REPLACE WITH YOUR USER ID

-- 3. Check when profile was last updated
SELECT 
    user_id,
    first_name,
    last_name,
    wizard_step,
    updated_at,
    NOW() - updated_at as time_since_update
FROM public.talent_profiles
WHERE user_id = 'your-user-id-here' -- REPLACE WITH YOUR USER ID
ORDER BY updated_at DESC;

-- 4. Check all recent profile updates (last 24 hours)
SELECT 
    tp.user_id,
    u.email,
    tp.first_name,
    tp.last_name,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.updated_at,
    NOW() - tp.updated_at as time_ago
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY tp.updated_at DESC;

