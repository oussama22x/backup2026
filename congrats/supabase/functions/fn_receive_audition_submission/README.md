# send-audition-to-vetted

Supabase Edge Function that sends completed audition data to the VettedAI external API.

## Overview

When a candidate completes an audition, this function:
1. Fetches the submission data with user info and opportunity details
2. Generates signed URLs (1 year expiry) for all audio files
3. Maps the data to the VettedAI API format
4. Sends the payload with automatic retry logic (3 attempts with exponential backoff)

## Prerequisites

### Database Setup

Run the migration to add the `vetted_project_id` column:

```sql
-- File: backend/supabase/add-vetted-project-id.sql
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS vetted_project_id UUID;
```

### Environment Variables

The function uses these Supabase environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Usage

### Invoke via HTTP

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-audition-to-vetted' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"submission_id": "uuid-of-submission"}'
```

### Invoke from Backend

```typescript
const { data, error } = await supabase.functions.invoke('send-audition-to-vetted', {
  body: { submission_id: 'uuid-of-submission' }
});
```

### Invoke from Database Trigger (Recommended)

Create a trigger to automatically send data when a submission is completed:

```sql
CREATE OR REPLACE FUNCTION trigger_send_to_vetted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed' or 'submitted'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-audition-to-vetted',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      ),
      body := jsonb_build_object('submission_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_completed
  AFTER UPDATE ON audition_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_to_vetted();
```

## API Payload Format

The function sends this exact format to the VettedAI API:

```json
{
  "submission_id": "uuid-of-submission",
  "project_id": "uuid-from-vetted_project_id",
  "email": "candidate@example.com",
  "name": "Candidate Name",
  "answers": [
    {
      "question_id": "C1",
      "transcript": "Answer text...",
      "audio_url": "https://signed-url-to-audio.webm"
    }
  ]
}
```

## Retry Logic

- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retry Conditions**: Only retries on 5xx server errors
- **No Retry**: 4xx client errors (bad request, not found, etc.)

## Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `submission_id is required` | 400 | Missing submission_id in request | Include submission_id in POST body |
| `Submission not found` | 404 | Invalid submission_id | Check that submission exists |
| `User not found` | 404 | User deleted or invalid | Verify user_id in submission |
| `Opportunity is not linked to a VettedAI project` | 400 | Missing vetted_project_id | Set vetted_project_id for the opportunity |
| `No valid audio files found` | 400 | No audio_urls or all failed | Check audio file paths and storage |
| `Client error 4xx` | 400 | VettedAI API rejected payload | Check payload format and API requirements |
| `Server error 5xx after 3 attempts` | 500 | VettedAI API unavailable | Check VettedAI API status, retry later |

## Deployment

Deploy the function using Supabase CLI:

```bash
supabase functions deploy send-audition-to-vetted
```

## Testing

### Test with Sample Data

1. Create a test submission with audio files
2. Set the `vetted_project_id` for the opportunity:
   ```sql
   UPDATE opportunities 
   SET vetted_project_id = 'uuid-from-vetted-api'
   WHERE id = 'your-opportunity-id';
   ```
3. Invoke the function:
   ```bash
   curl -X POST \
     'http://localhost:54321/functions/v1/send-audition-to-vetted' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"submission_id": "your-test-submission-id"}'
   ```

### View Logs

```bash
supabase functions logs send-audition-to-vetted
```

## Monitoring

The function logs detailed information:
- `🚀 Processing submission: {id}` - Function invoked
- `📊 Fetching submission data...` - Querying database
- `📝 Processing {n} audio files...` - Generating signed URLs
- `🔗 Generating signed URL for: {path}` - Each audio file
- `📦 Payload constructed` - Ready to send
- `📤 Attempt {n}/{max}` - Sending to API
- `✅ Success on attempt {n}` - API accepted payload
- `⚠️ Server error ({status}) on attempt {n}` - Retrying
- `❌ Error` - Failed permanently

## Architecture

```
┌─────────────────┐
│   Submission    │
│    Complete     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Function  │
│   Triggered     │
└────────┬────────┘
         │
         ├──► Fetch submission data
         ├──► Fetch user email/name
         ├──► Generate signed URLs (1 year)
         ├──► Map to API format
         │
         ▼
┌─────────────────┐
│  Retry Logic    │
│  (3 attempts)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VettedAI API   │
│   (External)    │
└─────────────────┘
```

## Notes

- Signed URLs expire after 1 year (31,536,000 seconds)
- The function uses the service role key to access all data
- Question IDs are extracted from the `opportunities.questions` array
- Transcripts are taken from `audio_urls[i].transcript` or `submission.questions[i]`
