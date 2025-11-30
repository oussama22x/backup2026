-- Find submissions with valid-looking question IDs (not "q1", "q2", etc.)
SELECT 
    submission_id,
    question_id,
    question_text
FROM audition_answers
WHERE question_id NOT LIKE 'q%' 
  AND question_id NOT LIKE 'Q%'
  AND length(question_id) > 5
LIMIT 20;
