-- Fix RLS policies for job_applications to avoid auth.users permission issues
-- The problem: RLS policies try to SELECT from auth.users which anonymous users don't have access to

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;

-- Create helper function to get current user's email without querying auth.users directly
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Recreate policies with the security definer function
-- Users can view their own applications (by user_id or email)
CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );

-- Users can create applications (authenticated or anonymous)
-- Anonymous users can insert, authenticated users can insert with their user_id
CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.role() = 'anon' OR -- Allow anonymous applications
    auth.uid() = user_id OR 
    user_id IS NULL -- Allow authenticated users to create without user_id set
  );

-- Users can update their own applications
CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );
