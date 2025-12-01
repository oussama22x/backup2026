-- Fetch all questions for the project
SELECT id, question_text, "order"
FROM questions 
WHERE project_id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d'
ORDER BY "order" ASC;
