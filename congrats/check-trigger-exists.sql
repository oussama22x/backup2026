-- Check if the trigger exists and is active in Congrats DB
-- Run this in Congrats Supabase SQL Editor

-- 1. Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'audition_submissions';

-- 2. Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%send_to_vetted%';

-- 3. Check recent submissions and their status
SELECT 
    id,
    user_id,
    status,
    submitted_at,
    created_at,
    updated_at
FROM audition_submissions
ORDER BY submitted_at DESC
LIMIT 5;
