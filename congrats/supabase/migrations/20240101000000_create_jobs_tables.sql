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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications((candidate_data->>'email'));
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_audition_submission_id ON public.job_applications(audition_submission_id);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs (public read, authenticated users can insert/update)
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Jobs are insertable by authenticated users" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Jobs are updatable by authenticated users" ON public.jobs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for job_applications
CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.role() = 'anon' -- Allow anonymous applications
  );

CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

