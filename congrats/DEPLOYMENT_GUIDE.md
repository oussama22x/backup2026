# Deployment Guide: send-audition-to-vetted Edge Function

## Step 1: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your **Congrats AI** project (the one with audition_submissions table)

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run Migration**
   - Open the file: `backend/supabase/add-vetted-project-id.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Go to "Table Editor" → "opportunities"
   - Verify the new column `vetted_project_id` appears

### Option B: Using Supabase CLI

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats

# Make sure you're linked to the correct project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f backend/supabase/add-vetted-project-id.sql
```

---

## Step 2: Deploy Edge Function

### Prerequisites

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```
   - This will open a browser to authenticate
   - Follow the prompts to complete login

3. **Link to Your Project**
   ```bash
   cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
   
   # Link to your project (you'll need your project ref)
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   **Finding your Project Ref:**
   - Go to Supabase Dashboard → Settings → General
   - Look for "Reference ID" (e.g., `abcdefghijklmnop`)

### Deploy the Function

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats

# Deploy the function
supabase functions deploy send-audition-to-vetted
```

**Expected Output:**
```
Deploying function send-audition-to-vetted...
Function deployed successfully!
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-audition-to-vetted
```

### Verify Deployment

1. **Check in Dashboard**
   - Go to Supabase Dashboard → Edge Functions
   - You should see `send-audition-to-vetted` listed

2. **Test the Function**
   ```bash
   curl -X POST \
     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-audition-to-vetted' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"submission_id": "test-uuid"}'
   ```
   
   **Finding your Anon Key:**
   - Supabase Dashboard → Settings → API
   - Copy "anon public" key

---

## Step 3: Set vetted_project_id for Opportunities

You need to map your internal opportunities to external VettedAI project UUIDs.

### Option A: Manual SQL Update (For Testing)

1. **Get a VettedAI Project UUID**
   - You mentioned you have `get-any-valid-project.sql`
   - Run that query in the **VettedAI database** (lagvszfwsruniuinxdjb)
   - Copy the `id` from the result

2. **Update Your Opportunities**
   ```sql
   -- In your Congrats AI database
   UPDATE opportunities 
   SET vetted_project_id = 'paste-uuid-from-vetted-here'
   WHERE id = 'your-opportunity-id';
   ```

### Option B: Bulk Update (For Production)

If you have multiple opportunities, create a mapping:

```sql
-- Example: Map all opportunities to their corresponding VettedAI projects
UPDATE opportunities 
SET vetted_project_id = CASE
  WHEN title = 'Backend Engineer' THEN 'uuid-for-backend-project'
  WHEN title = 'Frontend Developer' THEN 'uuid-for-frontend-project'
  WHEN title = 'ML Engineer' THEN 'uuid-for-ml-project'
  ELSE vetted_project_id
END;
```

### Option C: Create Admin UI (Future Enhancement)

You could add a field in your admin panel to set this when creating opportunities.

---

## Step 4: Test End-to-End

### 1. Create a Test Submission

Make sure you have a test submission with:
- Valid `user_id`
- Valid `opportunity_id` (with `vetted_project_id` set)
- Audio files in storage (`audio_urls` populated)

### 2. Invoke the Function

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-audition-to-vetted' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"submission_id": "your-test-submission-uuid"}'
```

### 3. Check Logs

```bash
# View function logs
supabase functions logs send-audition-to-vetted --tail
```

Or in the Dashboard:
- Edge Functions → send-audition-to-vetted → Logs

---

## Troubleshooting

### "supabase: command not found"

Install Supabase CLI:
```bash
npm install -g supabase
```

### "Project not linked"

Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Missing vetted_project_id"

Make sure you ran Step 3 to set the `vetted_project_id` for your opportunities.

### "User not found"

The `user_id` in the submission must exist in `auth.users` table.

### "No valid audio files found"

Check that `audio_urls` in the submission has valid `file_path` values and the files exist in storage.

---

## Quick Reference Commands

```bash
# Navigate to project
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats

# Login to Supabase
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy send-audition-to-vetted

# View logs
supabase functions logs send-audition-to-vetted --tail

# Test function
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-audition-to-vetted' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"submission_id": "test-uuid"}'
```

---

## Next Steps After Deployment

1. **Automate Invocation**: Add a database trigger to call the function when submissions are completed
2. **Monitor Logs**: Watch for errors in production
3. **Set Up Alerts**: Configure alerts for failed submissions
4. **Add Metrics**: Track success/failure rates
