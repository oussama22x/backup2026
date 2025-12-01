-- 1. Inspect role_definitions columns to be sure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_definitions';

-- 2. Find the ID for "UI/UX Designer" (which is the role_title of your project)
SELECT id, title, role_name -- guessing column names 'title' or 'role_name'
FROM role_definitions 
WHERE title ILIKE '%UI/UX%' OR role_name ILIKE '%UI/UX%';
