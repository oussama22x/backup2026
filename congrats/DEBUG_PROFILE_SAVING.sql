-- Debug Profile Saving Issues
-- Run these queries to diagnose why profiles aren't being saved

-- 1. Check if app_user exists for your user
-- Replace 'your-user-id' with actual user ID from auth.users
SELECT 
    'App User Check' as check_type,
    au.id,
    au.email,
    au.role,
    CASE 
        WHEN au.id IS NOT NULL THEN 'EXISTS ✓'
        ELSE 'MISSING ✗ - Profile cannot be created without app_user'
    END as status
FROM auth.users u
LEFT JOIN public.app_user au ON u.id = au.id
WHERE u.email = 'your-email@example.com'; -- Replace with your email

-- 2. Check if talent_profiles can be inserted (test with your user_id)
-- First get your user_id:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then check if app_user exists:
SELECT id, email, role FROM public.app_user WHERE id = 'your-user-id-here';

-- 3. Check RLS policies allow INSERT
SELECT 
    'RLS INSERT Policy' as check_type,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'talent_profiles'
AND cmd = 'INSERT';

-- 4. Test insert (will be rolled back)
-- Replace 'your-user-id' with actual user ID
BEGIN;
INSERT INTO public.talent_profiles (user_id, wizard_step, is_profile_complete, onboarding_completed)
VALUES ('your-user-id-here', 0, false, false)
ON CONFLICT (user_id) DO UPDATE SET wizard_step = 0;
ROLLBACK;

-- 5. Check for any existing profiles (even if RLS blocks you from seeing them)
SELECT 
    'Profile Count (Admin)' as check_type,
    COUNT(*) as total_count
FROM public.talent_profiles;

-- 6. Check foreign key constraint
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname LIKE '%talent_profiles%'
AND contype = 'f';

-- 7. Verify app_user trigger exists (creates app_user on signup)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

