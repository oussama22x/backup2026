-- Add resume_url column to app_user table
ALTER TABLE public.app_user
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add comment
COMMENT ON COLUMN public.app_user.resume_url IS 'URL to user resume stored in Supabase Storage';
