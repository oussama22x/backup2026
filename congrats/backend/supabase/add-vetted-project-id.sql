-- ============================================
-- ADD VETTED PROJECT ID TO OPPORTUNITIES
-- Migration: Add external VettedAI project UUID mapping
-- ============================================

-- Add vetted_project_id column to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS vetted_project_id UUID;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_vetted_project_id 
ON opportunities(vetted_project_id);

-- Add documentation
COMMENT ON COLUMN opportunities.vetted_project_id IS 
  'External VettedAI project UUID for API integration. Maps internal opportunities to external VettedAI projects.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities' 
  AND column_name = 'vetted_project_id';
