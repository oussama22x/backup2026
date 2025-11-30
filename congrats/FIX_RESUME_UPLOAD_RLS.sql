-- ============================================================================
-- FIX FOR RESUME UPLOAD ERROR
-- ============================================================================
-- Problem: Anonymous users get "new row violates row-level security policy" 
-- when uploading resumes during job application
--
-- Cause: Storage RLS policies require files to be in user-id folders,
-- but anonymous applications don't have auth.uid()
--
-- Solution: Add policies to allow anonymous resume uploads to resumes/ folder
-- ============================================================================

-- Step 1: Add policy for anonymous users to upload resumes
CREATE POLICY "Anonymous users can upload resumes for applications"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (auth.role() = 'anon' OR auth.uid() IS NOT NULL)
);

-- Step 2: Add policy for anonymous users to read their uploaded resumes (for confirmation)
CREATE POLICY "Anyone can view resumes folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
);

-- Step 3: Update existing policies to handle both authenticated and anonymous uploads
-- Drop old policy that conflicts
DROP POLICY IF EXISTS "Talents can upload own files" ON storage.objects;

-- Recreate with support for both authenticated users and resumes folder
CREATE POLICY "Talents can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'talent-files'
  AND (
    -- Authenticated users can upload to their own folder
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR
    -- Anyone (including anon) can upload to resumes folder
    ((storage.foldername(name))[1] = 'resumes')
  )
);

-- ============================================================================
-- DONE! Anonymous users can now upload resumes during job applications
-- ============================================================================
