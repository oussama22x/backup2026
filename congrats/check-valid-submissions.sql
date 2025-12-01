-- ============================================
-- Check if ANY submissions have valid users
-- Run this in YOUR Congrats AI database
-- ============================================

-- Step 1: Count total submissions with audio
SELECT COUNT(*) as total_submissions_with_audio
FROM audition_submissions
WHERE audio_urls IS NOT NULL 
  AND jsonb_array_length(audio_urls) > 0;

-- Step 2: Count how many have valid users
SELECT COUNT(*) as submissions_with_valid_users
FROM audition_submissions s
WHERE s.audio_urls IS NOT NULL 
  AND jsonb_array_length(s.audio_urls) > 0
  AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id::text = s.user_id::text
  );

-- Step 3: If Step 2 returns 0, you have NO valid test data
-- You'll need to create a new user and have them complete an audition

-- Step 4: If Step 2 returns > 0, run this to get the IDs:
SELECT 
  s.id as submission_id,
  s.user_id,
  s.opportunity_id
FROM audition_submissions s
WHERE s.audio_urls IS NOT NULL 
  AND jsonb_array_length(s.audio_urls) > 0
  AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id::text = s.user_id::text
  )
LIMIT 5;
