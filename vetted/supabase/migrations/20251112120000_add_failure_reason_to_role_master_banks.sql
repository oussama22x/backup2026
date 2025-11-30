-- Add failure_reason column to capture the last bank generation error
ALTER TABLE public.role_master_banks
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

COMMENT ON COLUMN public.role_master_banks.failure_reason IS
  'Latest failure reason recorded when generation fails. Cleared when the bank returns to READY.';
