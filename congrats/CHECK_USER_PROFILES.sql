-- Check if profiles exist for recent users
-- Run this to see which users have profiles and which don't

SELECT 
    u.id as auth_user_id,
    u.email,
    au.id as app_user_id,
    au.role,
    tp.id as profile_id,
    tp.first_name,
    tp.last_name,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.is_profile_complete,
    tp.updated_at as profile_updated_at,
    CASE 
        WHEN tp.id IS NOT NULL THEN 'HAS PROFILE ✓'
        ELSE 'NO PROFILE ✗'
    END as profile_status
FROM auth.users u
INNER JOIN public.app_user au ON u.id = au.id
LEFT JOIN public.talent_profiles tp ON u.id = tp.user_id
ORDER BY u.created_at DESC
LIMIT 20;

-- Check RLS policies for UPDATE
SELECT 
    'RLS UPDATE Policy' as check_type,
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'talent_profiles'
AND cmd = 'UPDATE';

-- Check if there are any profiles at all
SELECT 
    'Total Profiles' as check_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 day') as updated_today,
    COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as updated_this_week
FROM public.talent_profiles;

-- Check recent profile activity
SELECT 
    user_id,
    first_name,
    last_name,
    wizard_step,
    onboarding_completed,
    updated_at,
    CASE 
        WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 'Very Recent'
        WHEN updated_at > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN updated_at > NOW() - INTERVAL '7 days' THEN 'This Week'
        ELSE 'Older'
    END as recency
FROM public.talent_profiles
ORDER BY updated_at DESC
LIMIT 10;

