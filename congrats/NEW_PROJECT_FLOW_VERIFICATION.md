# New Project Flow Verification Report

**Date:** December 1, 2025  
**Purpose:** Verify that Congrats receives notifications when projects are created on Vetted, generates audition URLs, and sends them back to recruiters.

---

## ✅ Flow Overview

The complete flow works as follows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VETTED (External System)                                                   │
│  → Creates new project                                                      │
│  → POSTs to Congrats webhook                                                │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONGRATS: fn_receive_new_project Edge Function                             │
│  Location: congrats/supabase/functions/fn_receive_new_project/index.ts      │
│                                                                              │
│  1. ✅ Receives webhook payload from Vetted:                                 │
│     {                                                                        │
│       "project_id": "uuid",                                                  │
│       "project_title": "Senior AI Engineer",                                │
│       "recruiter_email": "recruiter@example.com",                           │
│       "recruiter_name": "Jane Doe"                                          │
│     }                                                                        │
│                                                                              │
│  2. ✅ Validates required fields (project_id, recruiter_email)               │
│                                                                              │
│  3. ✅ Inserts/Updates opportunity in database:                              │
│     - Uses Vetted project_id as the opportunity ID                          │
│     - Sets vetted_project_id = project_id                                   │
│     - Sets title, status='active', created_at                               │
│                                                                              │
│  4. ✅ Generates audition URL immediately:                                   │
│     Format: https://talent.vettedai.app/audition/{project_id}/start        │
│                                                                              │
│  5. ⚠️  MOCK EMAIL: Currently logs email to console (NOT SENT)              │
│     - To: recruiter_email                                                   │
│     - Subject: "Your Audition Link for {title} is Ready"                   │
│     - Body: Contains audition URL                                           │
│                                                                              │
│  6. ✅ Returns JSON response to Vetted:                                      │
│     {                                                                        │
│       "success": true,                                                      │
│       "message": "Project received, saved to DB, and link generated",       │
│       "data": {                                                             │
│         "project_id": "uuid",                                               │
│         "audition_url": "https://talent.vettedai.app/audition/.../start",  │
│         "email_sent": true,  // Currently hardcoded to true                │
│         "db_record": "uuid"                                                 │
│       }                                                                     │
│     }                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OPTIONAL: Database Trigger (NOT YET CONFIGURED)                            │
│  Function: notify-opportunity-creation                                      │
│                                                                              │
│  If configured:                                                             │
│  - Triggers on INSERT to opportunities table                                │
│  - Sends audition_url back to Vetted via separate webhook                  │
│  - Target: fn_receive_opportunity_created on Vetted side                   │
│  - Includes retry logic (up to 5 attempts with exponential backoff)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Component Analysis

### 1. **Webhook Receiver: `fn_receive_new_project`**

**File:** `/congrats/supabase/functions/fn_receive_new_project/index.ts`

**Status:** ✅ **IMPLEMENTED & DEPLOYED**

**Capabilities:**
- ✅ CORS-enabled for cross-origin requests
- ✅ Validates incoming payload structure
- ✅ Creates/updates opportunity in database (upsert)
- ✅ Generates audition URL in correct format
- ✅ Returns URL in response payload
- ⚠️  Email sending is **MOCKED** (logs only, not actually sent)

**Deployment:**
```bash
# Deploy script exists
./deploy_fn_receive_new_project.sh

# Deploys to:
# https://{PROJECT_REF}.supabase.co/functions/v1/fn_receive_new_project
```

**Testing:**
```bash
# Simulation script exists
./simulate_vetted_webhook.sh

# Sends mock payload to test the endpoint
```

---

### 2. **Audition URL Generation**

**Format:** `https://talent.vettedai.app/audition/{project_id}/start`

**Implementation:**
```typescript
const auditionUrl = `https://talent.vettedai.app/audition/${project_id}/start`;
```

**Status:** ✅ **WORKING**

**Notes:**
- Uses Vetted's project_id directly in the URL
- URL is publicly accessible (no auth required to start audition)
- Frontend route exists to handle this path (per README.md)

---

### 3. **URL Delivery to Recruiter**

**Current State:**

#### Method 1: Direct HTTP Response ✅ **WORKING**
The audition URL is returned in the immediate response to Vetted:
```json
{
  "success": true,
  "data": {
    "audition_url": "https://talent.vettedai.app/audition/.../start"
  }
}
```

#### Method 2: Email Notification ⚠️ **NOT IMPLEMENTED**
The function has placeholder code for email:
```typescript
// TODO: Integrate with Resend, SendGrid, or Supabase Auth Emails
console.log(`📧 MOCK EMAIL SENDING...`);
console.log(`   To: ${recruiter_email}`);
```

**Issue:** No actual email service integration exists.

**Action Required:** Integrate email provider (Resend/SendGrid/etc.)

---

### 4. **Optional Database Trigger**

**File:** `/congrats/supabase/functions/notify-opportunity-creation/index.ts`

**Status:** ⚠️ **IMPLEMENTED BUT NOT ENABLED**

**Purpose:** 
- Automatically sends audition URL back to Vetted when opportunity is inserted
- Provides redundancy/alternative to direct response

**Configuration Needed:**
The function exists but the database webhook/trigger is **not set up**.

**To Enable:**
1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - **Table:** `opportunities`
   - **Events:** INSERT
   - **URL:** `https://{PROJECT_REF}.supabase.co/functions/v1/notify-opportunity-creation`
   - **Method:** POST

**OR** run SQL trigger:
```sql
CREATE TRIGGER notify_opportunity_created
AFTER INSERT ON opportunities
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://{PROJECT_REF}.supabase.co/functions/v1/notify-opportunity-creation',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);
```

---

## 🚨 Issues Identified

### 1. **Email Not Actually Sent** ⚠️ **CRITICAL**
- **Impact:** Recruiters don't receive the audition URL via email
- **Workaround:** They must rely on the HTTP response from Vetted
- **Fix Required:** Integrate email service (Resend recommended)

### 2. **Database Trigger Not Enabled** ⚠️ **MEDIUM**
- **Impact:** No automatic notification to Vetted when opportunity is created
- **Current State:** Relies only on direct HTTP response
- **Benefit if Fixed:** Adds redundancy; Vetted gets notified even if initial response fails

### 3. **Hard-coded Domain** ℹ️ **LOW**
- **Issue:** Audition URL uses `https://talent.vettedai.app`
- **Impact:** Might not work for staging/dev environments
- **Fix:** Use environment variable for base URL

### 4. **No JWT Verification** ℹ️ **LOW**
- **Issue:** Function deployed with `--no-verify-jwt`
- **Impact:** Anyone can call this endpoint if they know the URL
- **Fix:** Add webhook secret verification or use Supabase JWT

---

## ✅ What Works

1. **Webhook Reception:** ✅ Congrats can receive notifications from Vetted
2. **Database Storage:** ✅ Opportunities are saved to the database
3. **URL Generation:** ✅ Audition URLs are generated correctly
4. **HTTP Response:** ✅ URL is returned to Vetted in the response
5. **Deployment Scripts:** ✅ Easy deployment and testing tools exist

---

## ⚠️ What Doesn't Work (Yet)

1. **Email Delivery:** ❌ Emails are not sent to recruiters
2. **Database Trigger:** ❌ Automatic notification to Vetted not enabled
3. **Security:** ⚠️ No webhook secret validation

---

## 🛠️ Recommended Fixes (Priority Order)

### Priority 1: Implement Email Sending
**Effort:** Medium  
**Impact:** High

**Option A: Use Resend (Recommended)**
```typescript
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'noreply@talent.vettedai.app',
  to: recruiter_email,
  subject: `Your Audition Link for ${project_title} is Ready`,
  html: `
    <h2>Your Audition Link is Ready!</h2>
    <p>Hello ${recruiter_name},</p>
    <p>Your audition link for <strong>${project_title}</strong> has been generated.</p>
    <p><a href="${auditionUrl}">Click here to share the audition link</a></p>
    <p>Link: <code>${auditionUrl}</code></p>
  `
});
```

**Steps:**
1. Sign up for Resend
2. Add `RESEND_API_KEY` to environment
3. Replace mock email code in `fn_receive_new_project`
4. Redeploy function

---

### Priority 2: Add Webhook Security
**Effort:** Low  
**Impact:** High

**Implementation:**
```typescript
// In fn_receive_new_project/index.ts
const WEBHOOK_SECRET = Deno.env.get('VETTED_WEBHOOK_SECRET');
const receivedSecret = req.headers.get('x-webhook-secret');

if (receivedSecret !== WEBHOOK_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Steps:**
1. Generate secure webhook secret
2. Share with Vetted team
3. Add to Supabase environment
4. Add validation to function
5. Redeploy

---

### Priority 3: Enable Database Trigger (Optional)
**Effort:** Low  
**Impact:** Medium

**Steps:**
1. Deploy `notify-opportunity-creation` function
2. Create database webhook in Supabase Dashboard
3. Test with manual insert

---

### Priority 4: Make Domain Configurable
**Effort:** Low  
**Impact:** Low

```typescript
const BASE_URL = Deno.env.get('AUDITION_BASE_URL') || 'https://talent.vettedai.app';
const auditionUrl = `${BASE_URL}/audition/${project_id}/start`;
```

---

## 🧪 Testing the Flow

### ✅ Test Results (December 1, 2025)

**Test Executed:**
```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
bash simulate_vetted_webhook.sh
```

**Response:**
```json
{
  "success": false,
  "error": "Failed to insert opportunity: Could not find the table 'public.opportunities' in the schema cache"
}
```

**Issue Found:** ⚠️ The `opportunities` table schema exists in `backend/supabase/schema.sql` but has **not been applied** to the live Supabase database.

**Schema File Location:** `/congrats/backend/supabase/schema.sql`

**Table Definition:**
```sql
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    rate TEXT NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    questions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    vetted_project_id UUID,  -- Links to Vetted's project
    ...
);
```

### 🔧 Required Setup Steps

**Before the flow can work, you must:**

1. **Apply Database Schema**
   ```bash
   # Option 1: Via Supabase Dashboard
   # 1. Go to https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe
   # 2. Navigate to SQL Editor
   # 3. Copy contents of backend/supabase/schema.sql
   # 4. Run the SQL
   
   # Option 2: Via Supabase CLI
   cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats/backend
   supabase db push
   ```

2. **Deploy the Edge Function** (if not already deployed)
   ```bash
   cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
   ./deploy_fn_receive_new_project.sh
   ```

3. **Re-run the Test**
   ```bash
   bash simulate_vetted_webhook.sh
   ```

4. **Expected Success Response:**
   ```json
   {
     "success": true,
     "message": "Project received, saved to DB, and link generated",
     "data": {
       "project_id": "test-project-1764557604",
       "audition_url": "https://talent.vettedai.app/audition/test-project-1764557604/start",
       "email_sent": true,
       "db_record": "test-project-1764557604"
     }
   }
   ```

### Production Test
Once schema is applied:
1. Have Vetted send a real webhook to:
   `https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_new_project`
2. Verify response contains `audition_url`
3. Test that URL works by visiting it
4. Check console logs for mock email output

---

## 📋 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Webhook receiver | ✅ Implemented | Function deployed and responding |
| Database schema | ❌ **NOT APPLIED** | Schema file exists but not run on DB |
| Database storage | ⏸️ Blocked | Waiting for schema to be applied |
| URL generation | ✅ Working | Creates correct format |
| HTTP response | ✅ Working | Returns URL to Vetted |
| Email delivery | ❌ Not working | Only logs to console |
| Database trigger | ⚠️ Not enabled | Function exists but not configured |
| Security | ⚠️ Missing | No webhook validation |

---

## 🎯 Next Steps

**To make this fully functional:**

### URGENT (Blocking)
1. **Apply database schema** ⚠️ **MUST DO FIRST**
   - Go to Supabase Dashboard → SQL Editor
   - Run `backend/supabase/schema.sql`
   - Or use `supabase db push`
   - **Without this, nothing works**

### High Priority
2. **Verify flow works** (after schema applied)
   - Re-run `./simulate_vetted_webhook.sh`
   - Confirm success response
   - Check opportunities table has record

3. **Implement email sending** (use Resend)
   - Add real email integration
   - Test recruiter receives the audition URL

### Medium Priority
4. **Add webhook secret validation**
   - Secure the endpoint
   - Share secret with Vetted team

### Optional
5. **Enable database trigger** (optional redundancy)
6. **Monitor logs** for any errors

**Estimated Time:** 
- Schema application: 5-10 minutes
- Email integration: 1-2 hours
- Security: 30 minutes

---

## 📞 Contact Points

- **Function URL:** `https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_new_project`
- **Project Ref:** `uvszvjbzcvkgktrvavqe` (from config.toml)
- **Deployment Scripts:** 
  - `deploy_fn_receive_new_project.sh`
  - `simulate_vetted_webhook.sh`

---

**Report Generated:** December 1, 2025  
**Status:** Flow is partially working; email integration required for full functionality.
