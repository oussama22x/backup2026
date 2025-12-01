-- Add resume columns to talent_profiles table
ALTER TABLE talent_profiles
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_file_path TEXT,
ADD COLUMN IF NOT EXISTS consent_to_store BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN talent_profiles.resume_url IS 'Public URL to candidate resume file';
COMMENT ON COLUMN talent_profiles.resume_file_path IS 'Storage path for resume file (e.g., resumes/user_id_timestamp.pdf)';
COMMENT ON COLUMN talent_profiles.consent_to_store IS 'User consent to store resume';
