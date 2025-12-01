-- 1. Get the role_definition_id from the project
-- 2. Use it to find the scaffold_data
SELECT 
    p.id as project_id,
    p.role_title,
    s.scaffold_data
FROM projects p
JOIN audition_scaffolds s ON s.role_definition_id = p.role_definition_id -- Assuming projects has role_definition_id?
WHERE p.id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d';

-- Check if projects has role_definition_id first?
-- Based on your earlier screenshot of 'projects', I didn't see it in the first few columns.
-- But 'role_title' was there. Maybe it links by 'role_title'? Or maybe 'role_id'?

-- Let's try to just get the row from audition_scaffolds directly if we can guess the link.
-- But wait, the screenshot of 'audition_scaffolds' shows 'role_definition_id'.

-- BETTER PLAN:
-- Let's check if 'projects' has 'role_definition_id' or similar.
-- Use the column list you got earlier for 'projects' (wait, you didn't paste the full list, just the first page).

-- SAFE BET:
-- Let's try to join on 'role_title' if 'role_definition_id' is missing in projects, 
-- OR just dump the 'audition_scaffolds' table to see what's in it.

SELECT * FROM audition_scaffolds LIMIT 5;
