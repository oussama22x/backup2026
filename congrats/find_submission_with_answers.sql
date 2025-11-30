
SELECT
    s.id as submission_id,
    s.user_id,
    s.opportunity_id,
    count(a.id) as answer_count
FROM audition_submissions s
JOIN audition_answers a ON s.user_id = a.user_id AND s.opportunity_id = a.opportunity_id
GROUP BY s.id, s.user_id, s.opportunity_id
HAVING count(a.id) > 0
ORDER BY s.submitted_at DESC
LIMIT 1;
