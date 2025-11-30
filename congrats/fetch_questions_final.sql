-- FINAL ATTEMPT: The Golden Path
-- 1. Find role_definition linked to the project
-- 2. Find audition_scaffold linked to that role_definition
-- 3. Get the scaffold_data

SELECT 
    rd.project_id,
    rd.id as role_definition_id,
    s.scaffold_data
FROM role_definitions rd
JOIN audition_scaffolds s ON s.role_definition_id = rd.id
WHERE rd.project_id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d';
