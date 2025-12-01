-- ============================================
-- STEP 3: Link Opportunities to VettedAI Projects
-- Run this in YOUR Congrats AI database AFTER getting the IDs above
-- ============================================

-- Example: Update a single opportunity
UPDATE opportunities 
SET vetted_project_id = 'PASTE-VETTED-PROJECT-ID-HERE'
WHERE id = 'PASTE-YOUR-OPPORTUNITY-ID-HERE';

-- Verify the update
SELECT 
  id,
  title,
  vetted_project_id
FROM opportunities
WHERE vetted_project_id IS NOT NULL;

-- ============================================
-- BULK UPDATE EXAMPLE (if you have multiple)
-- ============================================

-- If you want to map multiple opportunities at once:
/*
UPDATE opportunities 
SET vetted_project_id = CASE
  WHEN title = 'Backend Engineer' THEN 'uuid-for-backend-project'
  WHEN title = 'Frontend Developer' THEN 'uuid-for-frontend-project'
  WHEN title = 'ML Engineer' THEN 'uuid-for-ml-project'
  ELSE vetted_project_id
END;
*/
