-- Fix RLS policies for jobs table to allow authenticated users to insert/update
-- This migration fixes the "new row violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Jobs are insertable by authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are updatable by authenticated users" ON public.jobs;

-- Recreate with correct check - allow authenticated users to insert/update jobs
-- Using auth.uid() IS NOT NULL ensures only authenticated users can modify jobs
CREATE POLICY "Jobs are insertable by authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Jobs are updatable by authenticated users" ON public.jobs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

