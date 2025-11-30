-- ============================================================================
-- FIX FOR RESUME UPLOAD ERROR (Migration Version)
-- ============================================================================

-- Add policy for anonymous users to upload resumes
CREATE POLICY "Anonymous users can upload resumes for applications"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (auth.role() = 'anon' OR auth.uid() IS NOT NULL)
);

-- Add policy for anyone to view resumes folder
CREATE POLICY "Anyone can view resumes folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
);

-- Update existing upload policy to handle both authenticated and anonymous uploads
DROP POLICY IF EXISTS "Talents can upload own files" ON storage.objects;

CREATE POLICY "Talents can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'talent-files'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR
    ((storage.foldername(name))[1] = 'resumes')
  )
);
