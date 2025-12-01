-- Migration: Backfill app_user table with existing auth.users
-- This ensures all existing authenticated users have an app_user record

-- Insert any auth users that don't have an app_user record yet
-- Default role is TALENT for all candidates
INSERT INTO app_user (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'TALENT' as role,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN app_user apu ON au.id = apu.id
WHERE apu.id IS NULL
  AND au.email IS NOT NULL;

-- Log the results
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % users into app_user table', inserted_count;
END $$;
