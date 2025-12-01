-- ============================================
-- Check audition_answers table structure
-- Run this in YOUR Congrats AI database
-- ============================================

-- Get all column names from audition_answers table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audition_answers'
ORDER BY ordinal_position;

-- This will show you all the columns in the table
-- Look for the column that links to audition_submissions
-- It might be called: audition_submission_id, audition_id, etc.
