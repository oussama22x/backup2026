# Verification Checklist: Candidate Submission → Recruiter Dashboard

## 🔍 Issues Found

### ❌ Problem 1: Authorization Header Mismatch
**Issue**: VettedAI expects valid JWT but Congrats sends webhook secret
**Location**: `/congrats/supabase/functions/fn_receive_audition_submission/index.ts` line 156
**Fixed**: Changed from `x-webhook-secret` to `Authorization: Bearer ${WEBHOOK_SECRET}`
**Status**: ⚠️ Still failing - VettedAI rejects the token as "Invalid JWT"

### ❌ Problem 2: Need Correct VettedAI Service Role Key
**Issue**: The WEBHOOK_SECRET in Congrats function is not a valid JWT for VettedAI
**Current**: `81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0`
**Needs**: VettedAI's actual service_role key

## ✅ What's Working

1. ✅ VettedAI function exists: `fn_receive_audition_submission`
2. ✅ Congrats function exists and deployed
3. ✅ Profile data mapping is complete
4. ✅ Payload construction is correct

## 🔧 To Fix

### Step 1: Get VettedAI Service Role Key

1. Go to **VettedAI Supabase Dashboard** (lagvszfwsruniuinxdjb)
2. Navigate to: **Settings** → **API**
3. Copy the **service_role secret** key
4. Update the WEBHOOK_SECRET in Congrats function

### Step 2: Update Congrats Function

File: `/congrats/supabase/functions/fn_receive_audition_submission/index.ts`

Change line 148:
```typescript
const WEBHOOK_SECRET = "PASTE_VETTEDAI_SERVICE_ROLE_KEY_HERE";
```

Then redeploy:
```bash
supabase functions deploy fn_receive_audition_submission --project-ref uvszvjbzcvkgktrvavqe
```

### Step 3: Verify Trigger is Set Up

Run this in **Congrats Supabase SQL Editor**:
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'audition_submissions';
```

**Expected**: Should see triggers like:
- `on_submission_completed` (AFTER UPDATE)
- `on_submission_created` (AFTER INSERT)

### Step 4: Check Trigger Function

Run this in **Congrats Supabase SQL Editor**:
```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'trigger_send_to_vetted';
```

**Expected**: Function should call `fn_receive_audition_submission`

If missing, run: `/congrats/setup_vetted_trigger.sql`

### Step 5: Test End-to-End

1. Create a test submission or use existing one
2. Update submission status to trigger webhook:
```sql
UPDATE audition_submissions 
SET status = 'pending_review' 
WHERE id = '81d388a1-1f2e-409a-8acd-b2d6a9739ebd';
```

3. Check Congrats function logs:
```
Dashboard → Functions → fn_receive_audition_submission → Logs
```

4. Check VettedAI function logs:
```
VettedAI Dashboard → Functions → fn_receive_audition_submission → Logs
```

## 📊 Expected Flow

```
1. Candidate finishes audition
   ↓
2. Status changes to 'pending_review' 
   ↓
3. Database trigger fires (trigger_send_to_vetted)
   ↓
4. Calls Congrats fn_receive_audition_submission
   ↓
5. Fetches submission + profile data
   ↓
6. Sends to VettedAI fn_receive_audition_submission
   ↓
7. VettedAI stores submission
   ↓
8. Recruiter sees it on dashboard
```

## 🎯 Quick Fix Commands

```bash
# 1. Get VettedAI service role key (run in VettedAI dashboard SQL)
SELECT current_setting('request.jwt.secret', true);

# 2. Or get it from Dashboard:
# Settings → API → service_role secret

# 3. Update the function, then:
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
supabase functions deploy fn_receive_audition_submission --project-ref uvszvjbzcvkgktrvavqe

# 4. Test manually:
curl -X POST "https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_audition_submission" \
  -H "Authorization: Bearer YOUR_CONGRATS_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submission_id": "81d388a1-1f2e-409a-8acd-b2d6a9739ebd"}'
```

## 📝 Summary

**Main Issue**: Wrong authentication token being sent to VettedAI

**Solution**: Update WEBHOOK_SECRET to VettedAI's actual service_role key

**Once fixed**: Submissions will automatically flow from Congrats → VettedAI → Recruiter Dashboard ✅
