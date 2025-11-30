-- ============================================
-- STEP 1: Get Your Opportunity IDs
-- Run this in YOUR Congrats AI database
-- ============================================

-- List all opportunities with their IDs
SELECT 
  id as opportunity_id,
  title,
  company,
  status,
  created_at
FROM opportunities
ORDER BY created_at DESC;

-- Copy the 'opportunity_id' values from the results above
