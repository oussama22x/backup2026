-- Run this in your VETTED AI Supabase SQL Editor

-- 1. Check the 'projects' table for a 'scaffold' or 'questions' column
SELECT id, title, scaffold, questions 
FROM projects 
WHERE id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d';

-- 2. If there is a separate 'questions' table, check that
-- SELECT * FROM questions WHERE project_id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d';

-- 3. List all columns in 'projects' to see where questions might be stored
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'projects';
