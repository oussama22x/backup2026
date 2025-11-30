-- Find Your Profile - Use this to check if your profile is saved
-- Replace the user_id below with the one from your browser console logs

-- Method 1: Find by user_id (from console logs)
-- Look in browser console for: "Saving profile progress: {user_id: '...', ...}"
-- Copy that user_id and paste it below
SELECT 
    tp.id,
    tp.user_id,
    u.email,
    tp.first_name,
    tp.last_name,
    tp.linkedin_url,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.is_profile_complete,
    tp.experience_level,
    tp.desired_roles,
    tp.work_arrangements,
    tp.location_preferences,
    tp.current_city,
    tp.current_country,
    tp.start_timing,
    tp.desired_salary_min,
    tp.desired_salary_max,
    tp.created_at,
    tp.updated_at,
    NOW() - tp.updated_at as time_since_update
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.user_id = 'bb13dcb1-2791-4c2a-8328-89af54c651c9'; -- REPLACE WITH YOUR USER_ID FROM CONSOLE

-- Method 2: Find by email (make sure email is correct with @ symbol)
SELECT 
    tp.id,
    tp.user_id,
    u.email,
    tp.first_name,
    tp.last_name,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.updated_at
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE u.email = 'your-email@example.com'; -- REPLACE WITH YOUR FULL EMAIL (include @)

-- Method 3: Find all profiles for your email domain
SELECT 
    tp.id,
    tp.user_id,
    u.email,
    tp.first_name,
    tp.last_name,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.updated_at
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE u.email LIKE '%@faithfoundrytech.com'; -- Adjust domain as needed

-- Method 4: Check all recent profile updates (last hour)
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
WHERE tp.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY tp.updated_at DESC;

-- Method 5: Check RLS policies - see if you can read your own profile
-- Run this while logged in as the user
SELECT 
    tp.*,
    u.email
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.user_id = auth.uid(); -- This uses the current logged-in user

