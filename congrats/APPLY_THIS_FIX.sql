-- ============================================================================
-- COMPLETE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This fixes all permission issues for job applications and resume uploads
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Job Applications RLS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;

-- Create security definer function (allows safe access to auth.users)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- New policies using security definer function
CREATE POLICY "Users can view their own applications" 
ON public.job_applications
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
);

CREATE POLICY "Users can create applications" 
ON public.job_applications
FOR INSERT 
WITH CHECK (
  auth.role() = 'anon' OR
  auth.uid() = user_id OR 
  user_id IS NULL
);

CREATE POLICY "Users can update their own applications" 
ON public.job_applications
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
);

-- ============================================================================
-- PART 2: Fix Storage RLS for Resume Uploads
-- ============================================================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Anonymous users can upload resumes for applications" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view resumes folder" ON storage.objects;
DROP POLICY IF EXISTS "Talents can upload own files" ON storage.objects;

-- Allow anonymous resume uploads to resumes/ folder
CREATE POLICY "Anonymous users can upload resumes for applications"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
);

-- Allow viewing resumes folder
CREATE POLICY "Anyone can view resumes folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'talent-files'
  AND (storage.foldername(name))[1] = 'resumes'
);

-- Combined upload policy for authenticated users AND resumes folder
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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check job_applications policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies 
WHERE tablename = 'job_applications'
ORDER BY cmd;

-- Check storage.objects policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%resume%' OR policyname LIKE '%talent%'
ORDER BY cmd;

-- ============================================================================
-- ✅ DONE! 
-- If you see policies listed above, the fix was successful!
-- Now refresh your app and try submitting an application.
-- ============================================================================
