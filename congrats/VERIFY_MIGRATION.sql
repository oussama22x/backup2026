-- Verification queries to check if jobs table exists and has correct structure
-- Run these in Supabase SQL Editor to verify the migration was successful

-- 1. Check if jobs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'jobs';

-- 2. Check if job_applications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'job_applications';

-- 3. Check jobs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'jobs'
ORDER BY ordinal_position;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'job_applications');

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('jobs', 'job_applications');

-- 6. Try to select from jobs table (should work if RLS allows)
SELECT COUNT(*) as job_count FROM public.jobs;

-- 7. Check if you can see any jobs
SELECT id, slug, title, is_active FROM public.jobs LIMIT 5;

