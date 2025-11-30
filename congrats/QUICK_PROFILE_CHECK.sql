-- Quick Check: Does talent_profiles table exist?
-- Run this first to verify the table exists

SELECT 
    'talent_profiles' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'talent_profiles'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING ✗ - Run migration 20250930235237_eb2d1a39-6593-476e-b9ad-14567b8f8c7f.sql'
    END as status;

-- If table exists, show structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'talent_profiles'
ORDER BY ordinal_position;

-- Check foreign key (should reference app_user)
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'talent_profiles'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'talent_profiles';

-- Count existing profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE onboarding_completed = true) as completed,
    COUNT(*) FILTER (WHERE is_profile_complete = true) as profile_complete
FROM public.talent_profiles;

