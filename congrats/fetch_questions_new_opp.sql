-- Fetch questions for the NEW opportunity ID
-- Opportunity ID: 98420d72-251d-4b92-9539-6fd0657c695a

SELECT 
    rd.project_id,
    rd.id as role_definition_id,
    s.scaffold_data
FROM role_definitions rd
JOIN audition_scaffolds s ON s.role_definition_id = rd.id
WHERE rd.project_id = '98420d72-251d-4b92-9539-6fd0657c695a';
