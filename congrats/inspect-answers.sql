-- Inspect answers for the failing submission
SELECT 
    id,
    question_id,
    question_index,
    question_text,
    transcript
FROM audition_answers
WHERE submission_id = 'bcb17634-67f2-43ba-a4bd-865591ab8471';
