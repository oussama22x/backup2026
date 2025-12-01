
-- Function to trigger the Edge Function
CREATE OR REPLACE FUNCTION trigger_send_to_vetted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed' or 'submitted'
  -- Adjust 'pending_review' if that's the status used in your app
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    PERFORM net.http_post(
      url := 'https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_audition_submission',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.header.apikey', true)
      ),
      body := jsonb_build_object('submission_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS on_submission_completed ON public.audition_submissions;
CREATE TRIGGER on_submission_completed
  AFTER UPDATE ON public.audition_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_to_vetted();

-- Also trigger on INSERT if the status is already 'pending_review'
DROP TRIGGER IF EXISTS on_submission_created ON public.audition_submissions;
CREATE TRIGGER on_submission_created
  AFTER INSERT ON public.audition_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_to_vetted();
