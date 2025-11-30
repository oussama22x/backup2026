-- ============================================
-- Get a Valid VettedAI Project UUID
-- Run this in the VETTED database (lagvszfwsruniuinxdjb)
-- ============================================

-- Get any valid project UUID from VettedAI
SELECT 
  id as vetted_project_uuid,
  role_definition_id,
  version
FROM audition_scaffolds
LIMIT 1;

-- Copy the 'vetted_project_uuid' value
-- Then run this in YOUR Congrats AI database:

/*
UPDATE opportunities 
SET vetted_project_id = 'PASTE-UUID-HERE'
WHERE id = 'hr-trainee';
*/
