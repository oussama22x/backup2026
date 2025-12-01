-- ============================================================================
-- FIX FOR JOB APPLICATION SUBMISSION ERROR
-- ============================================================================
-- Problem: Anonymous/authenticated users get "permission denied for table users" 
-- when submitting job applications
--
-- Cause: RLS policies try to SELECT from auth.users which users don't have access to
--
-- Solution: Use security definer function to safely access auth.users
-- ============================================================================

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;

-- Step 2: Create helper function with elevated privileges
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Step 3: Recreate policies using the security definer function
-- Policy for SELECT: Users can view their own applications (by user_id or email)
CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );

-- Policy for INSERT: Allow both anonymous and authenticated users
CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.role() = 'anon' OR -- Allow anonymous applications
    auth.uid() = user_id OR 
    user_id IS NULL -- Allow authenticated users to create without user_id set
  );

-- Policy for UPDATE: Users can update their own applications
CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );

-- ============================================================================
-- DONE! You can now submit job applications without permission errors
-- ============================================================================
