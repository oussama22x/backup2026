-- Check User Profile Storage
-- Run this to verify where profiles are stored and check for issues

-- 1. Check if talent_profiles table exists
SELECT 
    'Table Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'talent_profiles';

-- 2. Check table structure
SELECT 
    'Column Check' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'talent_profiles'
ORDER BY ordinal_position;

-- 3. Check foreign key relationship
SELECT 
    'Foreign Key Check' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'talent_profiles';

-- 4. Check RLS is enabled
SELECT 
    'RLS Check' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'talent_profiles';

-- 5. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'talent_profiles';

-- 6. Count profiles
SELECT 
    'Profile Count' as check_type,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE onboarding_completed = true) as completed_profiles,
    COUNT(*) FILTER (WHERE is_profile_complete = true) as profile_complete_count
FROM public.talent_profiles;

-- 7. Check recent profile updates
SELECT 
    'Recent Updates' as check_type,
    user_id,
    first_name,
    last_name,
    wizard_step,
    onboarding_completed,
    updated_at
FROM public.talent_profiles
ORDER BY updated_at DESC
LIMIT 5;

-- 8. Check if app_user table exists (if migration references it)
SELECT 
    'App User Table Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'app_user';

-- 9. Verify auth.users exists (standard Supabase)
SELECT 
    'Auth Users Check' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

