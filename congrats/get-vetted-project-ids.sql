-- ============================================
-- STEP 2: Get VettedAI Project IDs
-- Run this in the VETTED database (lagvszfwsruniuinxdjb)
-- ============================================

-- List all available projects from VettedAI
SELECT 
  id as vetted_project_id,
  role_definition_id,
  version,
  created_at
FROM audition_scaffolds
ORDER BY created_at DESC
LIMIT 10;

-- Copy the 'vetted_project_id' values from the results above
