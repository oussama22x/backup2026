-- Update the test submission's answers to use VALID VettedAI Question IDs
-- Submission ID: 7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f

-- 1. Q004_E2_define_done
UPDATE audition_answers SET question_id = 'Q004_E2_define_done' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q1';

-- 2. Q005_E3_anticipate_risk
UPDATE audition_answers SET question_id = 'Q005_E3_anticipate_risk' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q2';

-- 3. Q003_E1_plan_sequence
UPDATE audition_answers SET question_id = 'Q003_E1_plan_sequence' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q3';

-- 4. Q010_A2_clarify_ask
UPDATE audition_answers SET question_id = 'Q010_A2_clarify_ask' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q4';

-- 5. Q013_EI2_respectful_pushback
UPDATE audition_answers SET question_id = 'Q013_EI2_respectful_pushback' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q5';

-- 6. Q006_CC1_translate_for_audience
UPDATE audition_answers SET question_id = 'Q006_CC1_translate_for_audience' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q6';

-- 7. Q008_CC3_resolve_disagreement
UPDATE audition_answers SET question_id = 'Q008_CC3_resolve_disagreement' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q7';

-- 8. Q012_EI1_deescalate
UPDATE audition_answers SET question_id = 'Q012_EI1_deescalate' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q8';

-- 9. Q007_CC2_report_up
UPDATE audition_answers SET question_id = 'Q007_CC2_report_up' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q9';

-- 10. Q014_EI3_handle_feedback
UPDATE audition_answers SET question_id = 'Q014_EI3_handle_feedback' 
WHERE submission_id = '7c1023a7-ca7a-4d13-a1e1-e5abb1eeaf5f' AND question_id = 'q10';
