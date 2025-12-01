-- DIAGNOSE AND FIX JOBS TABLES
-- Run this in Supabase SQL Editor to check and fix everything

-- Step 1: Check if tables exist
SELECT 
    'Tables Check' as step,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('jobs', 'job_applications')
ORDER BY table_name;

-- Step 2: If tables don't exist, create them
-- (This will only create if they don't exist due to IF NOT EXISTS)

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internship', 'graduate_trainee')),
  category TEXT NOT NULL DEFAULT 'General',
  location TEXT NOT NULL DEFAULT 'Remote',
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_source TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  candidate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'pending', 'approved', 'rejected', 'accepted', 'declined')),
  source TEXT DEFAULT 'direct',
  utm_params JSONB DEFAULT '{}'::jsonb,
  audition_submission_id UUID REFERENCES public.audition_submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications((candidate_data->>'email'));
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_audition_submission_id ON public.job_applications(audition_submission_id);

-- Step 4: Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are insertable by authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are updatable by authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are insertable by anon users" ON public.jobs;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;

-- Step 6: Create RLS Policies for jobs
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Jobs are insertable by authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Jobs are updatable by authenticated users" ON public.jobs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Jobs are insertable by anon users" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Step 7: Create RLS Policies for job_applications
CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.role() = 'anon'
  );

CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Step 8: Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 10: Verify everything
SELECT 
    'Verification' as step,
    'Tables created and policies set' as status,
    (SELECT COUNT(*) FROM public.jobs) as jobs_count,
    (SELECT COUNT(*) FROM public.job_applications) as applications_count;

-- Step 11: Test insert (will be rolled back)
BEGIN;
INSERT INTO public.jobs (id, slug, title, type) 
VALUES ('test-job-' || gen_random_uuid()::text, 'test-slug', 'Test Job', 'graduate_trainee')
ON CONFLICT (id) DO NOTHING;
ROLLBACK;

SELECT 'Setup Complete! Tables are ready to use.' as status;

