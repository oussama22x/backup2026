-- Fetch all questions for the project (using opportunity_id)
SELECT id, question_text, question_order
FROM questions 
WHERE opportunity_id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d'
ORDER BY question_order ASC;
