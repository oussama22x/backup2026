-- Check the schema of audition_submissions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audition_submissions'
ORDER BY ordinal_position;
