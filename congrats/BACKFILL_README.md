# VettedAI Backfill Script

## Purpose

This script manually syncs historical audition submissions from **November 25-26, 2024** to the VettedAI webhook endpoint. It's designed to backfill data that was missing before the automated webhook was set up.

## What It Does

The script performs the **exact same logic** as the live `send-audition-to-vetted` Edge Function:

1. ✅ Queries submissions from the specified date range
2. ✅ Fetches candidate details (email, name) from auth.users or talent_profiles
3. ✅ Retrieves the VettedAI project ID from the opportunities table
4. ✅ Fetches all answers for each submission
5. ✅ **Generates signed URLs** for audio files (valid for 1 year)
6. ✅ **Generates signed URLs** for resume files (valid for 1 year)
7. ✅ Constructs the proper JSON payload
8. ✅ Sends to VettedAI with retry logic (up to 3 attempts)
9. ✅ Provides detailed logging for each submission

## Prerequisites

- **Deno** installed on your system ([install instructions](https://deno.land/))
- Environment variables set in `backend/.env`:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Usage

### Option 1: Using the Shell Script (Recommended)

```bash
./run-backfill.sh
```

This automatically loads environment variables from `backend/.env` and runs the script.

### Option 2: Direct Deno Execution

```bash
# Export environment variables first
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
deno run --allow-net --allow-env --allow-read backfill-vetted-submissions.ts
```

## Configuration

You can modify the date range in `backfill-vetted-submissions.ts`:

```typescript
// Date range for backfill (November 25-26, 2024)
const START_DATE = "2024-11-25T00:00:00Z";
const END_DATE = "2024-11-26T23:59:59Z";
```

## Output

The script provides detailed console output:

```
🚀 VettedAI Backfill Script
================================================================================
📅 Date Range: 2024-11-25T00:00:00Z to 2024-11-26T23:59:59Z
🎯 Target: https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_audition_submission
================================================================================
✅ Connected to Supabase

🔍 Querying submissions...
✅ Found 5 submissions to process

[1/5] ======================================================================

📝 Processing submission: abc123...
   User: user-id-123
   Opportunity: opp-id-456
   Created: 2024-11-25T10:30:00Z
  🏢 Fetching opportunity details...
  👤 Fetching user details...
  📧 Email: candidate@example.com
  👤 Name: John Doe
  📋 Project ID: ff395a72-ddb8-4693-a46a-09a0b5a53585
  📄 Fetching resume...
  ✅ Generated signed resume URL
  🎤 Fetching answers...
  ✅ Found 10 answers
  🔗 Generating signed URL for audio: Q1...
  📦 Payload constructed with 10 answers
  🚀 Sending to VettedAI...
  🔄 Attempt 1/3...
  ✅ Success (200): { success: true }

...

================================================================================
📊 BACKFILL SUMMARY
================================================================================
✅ Successful: 4
❌ Failed: 1
⏭️  Skipped: 0
📝 Total: 5

✅ Successfully synced submissions:
   - abc123... (Project: ff395a72-ddb8-4693-a46a-09a0b5a53585)
   - def456... (Project: ff395a72-ddb8-4693-a46a-09a0b5a53585)
   ...

❌ Failed submissions:
   - xyz789...: Client error 400: Question not found

================================================================================
✨ Backfill complete!
================================================================================
```

## Error Handling

The script includes robust error handling:

- **Client Errors (4xx)**: Logged and reported, no retry
- **Server Errors (5xx)**: Automatic retry with exponential backoff (up to 3 attempts)
- **Network Errors**: Automatic retry with 2-second delay
- **Missing Data**: Submissions without answers are skipped

## Payload Structure

Each submission is sent with this exact structure:

```json
{
  "submission_id": "uuid-here",
  "project_id": "vetted-project-uuid",
  "email": "candidate@example.com",
  "name": "Candidate Name",
  "resume_url": "https://signed-url-valid-for-1-year",
  "answers": [
    {
      "question_id": "Q1",
      "question_text": "Tell us about yourself",
      "transcript": "I am a software engineer...",
      "audio_url": "https://signed-url-valid-for-1-year",
      "submitted_at": "2024-11-25T10:35:00Z"
    }
  ]
}
```

## Authentication

The script uses the same authentication as the live webhook:

- **Header**: `x-webhook-secret: 81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0`
- **Header**: `Authorization: Bearer [VETTED_API_KEY]`

## Troubleshooting

### "No submissions found"

- Check the date range in the script
- Verify submissions exist in the database for those dates
- Check submission status (must be 'completed', 'pending_review', or 'started')

### "Missing environment variables"

- Ensure `backend/.env` exists and contains the required variables
- Or export them manually before running

### "Could not generate signed URL"

- Check that the storage bucket exists (`audition-recordings`, `talent-files`)
- Verify the file paths in the database are correct
- Ensure the service role key has storage permissions

### "Client error 400: Question not found"

- This means the question IDs in your submission don't match the VettedAI project scaffold
- This is expected if you're using test data with different question IDs
- The submission is still logged and reported

## Files

- `backfill-vetted-submissions.ts` - Main Deno script
- `run-backfill.sh` - Shell wrapper for easy execution
- `BACKFILL_README.md` - This documentation

## Notes for Tobi

- ✅ Script mirrors the exact logic from the live Edge Function
- ✅ Generates fresh signed URLs valid for 1 year
- ✅ Includes retry logic for reliability
- ✅ Detailed logging shows exactly what happened with each submission
- ✅ Summary report at the end for easy review
- ✅ Safe to run multiple times (VettedAI will handle duplicates)

## Next Steps

After running the backfill:

1. Review the summary output
2. Check VettedAI dashboard to confirm submissions arrived
3. Investigate any failed submissions if needed
4. Keep this script for future manual syncs if required
