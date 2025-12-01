# Quick Action Plan: Enable New Project Flow

**Goal:** Make Congrats receive project creation notifications from Vetted and send back audition URLs

**Current Status:** 🔴 BLOCKED - Database schema not applied

---

## ⚡ Step 1: Apply Database Schema (URGENT - 5 minutes)

### Option A: Via Supabase Dashboard (Recommended)
1. Open browser: https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open file: `/home/oussama/Desktop/vetted-congrats-Flow0.1/congrats/backend/supabase/schema.sql`
5. Copy entire contents (all 266 lines)
6. Paste into Supabase SQL Editor
7. Click **Run**
8. Wait for "Success" message

### Option B: Via Supabase CLI
```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats/backend
supabase db push
```

### ✅ Verification
```sql
-- Run this in SQL Editor to confirm table exists
SELECT COUNT(*) FROM public.opportunities;
-- Should return: 0 (empty table, but no error)
```

---

## ⚡ Step 2: Test the Webhook (2 minutes)

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
bash simulate_vetted_webhook.sh
```

### Expected Output:
```json
{
  "success": true,
  "message": "Project received, saved to DB, and link generated",
  "data": {
    "project_id": "test-project-XXXXXXXXXX",
    "audition_url": "https://talent.vettedai.app/audition/test-project-XXXXXXXXXX/start",
    "email_sent": true,
    "db_record": "test-project-XXXXXXXXXX"
  }
}
```

### If it fails:
- Check Supabase dashboard logs (Functions → fn_receive_new_project → Logs)
- Verify RLS policies aren't blocking inserts
- Ensure edge function is deployed

---

## ⚡ Step 3: Add Missing Field to Schema (2 minutes)

The `opportunities` table needs a `vetted_project_id` column if it doesn't exist.

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS vetted_project_id UUID;

CREATE INDEX IF NOT EXISTS idx_opportunities_vetted_project_id 
ON public.opportunities(vetted_project_id);
```

---

## ⚡ Step 4: Integrate Email Sending (1-2 hours)

### 4.1 Sign up for Resend
1. Go to https://resend.com
2. Create free account
3. Verify domain (or use their testing domain)
4. Get API key from dashboard

### 4.2 Add API Key to Supabase
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx` (from Resend)

### 4.3 Update Edge Function Code

Edit: `/congrats/supabase/functions/fn_receive_new_project/index.ts`

Replace lines 59-67 (the mock email section) with:

```typescript
// 5. Send Email via Resend
import { Resend } from "https://esm.sh/resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
let emailSent = false;

if (resendApiKey) {
    try {
        const resend = new Resend(resendApiKey);
        
        const { data, error } = await resend.emails.send({
            from: "noreply@talent.vettedai.app", // Use your verified domain
            to: recruiter_email,
            subject: `Your Audition Link for ${project_title || 'New Project'} is Ready`,
            html: `
                <h2>🎉 Your Audition Link is Ready!</h2>
                <p>Hello ${recruiter_name || 'Recruiter'},</p>
                <p>Your audition link for <strong>${project_title}</strong> has been successfully generated.</p>
                
                <div style="margin: 30px 0;">
                    <a href="${auditionUrl}" 
                       style="background: #0070f3; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        View Audition Link
                    </a>
                </div>
                
                <p><strong>Share this link with candidates:</strong></p>
                <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
                    ${auditionUrl}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated message from Congrats AI Talent Platform
                </p>
            `,
        });

        if (error) {
            console.error("❌ Email Error:", error);
        } else {
            console.log("✅ Email sent successfully:", data);
            emailSent = true;
        }
    } catch (error) {
        console.error("❌ Failed to send email:", error.message);
    }
} else {
    console.warn("⚠️  RESEND_API_KEY not set. Email not sent.");
}
```

### 4.4 Redeploy Function
```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
./deploy_fn_receive_new_project.sh
```

### 4.5 Test Email
```bash
# Edit simulate_vetted_webhook.sh to use your real email
# Change line: "recruiter_email": "your-real-email@example.com"
bash simulate_vetted_webhook.sh
```

Check your inbox for the email!

---

## ⚡ Step 5: Add Security (30 minutes)

### 5.1 Generate Webhook Secret
```bash
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...
```

### 5.2 Add to Supabase Secrets
- Name: `VETTED_WEBHOOK_SECRET`
- Value: (the generated hex string)

### 5.3 Update Edge Function

Add at the top of the request handler (after line 16):

```typescript
// Verify webhook secret
const WEBHOOK_SECRET = Deno.env.get("VETTED_WEBHOOK_SECRET");
const receivedSecret = req.headers.get("x-webhook-secret");

if (WEBHOOK_SECRET && receivedSecret !== WEBHOOK_SECRET) {
    console.error("❌ Invalid webhook secret");
    return new Response(JSON.stringify({ 
        success: false, 
        error: "Unauthorized" 
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
    });
}
```

### 5.4 Share Secret with Vetted Team
Send them the webhook secret so they can include it in their requests:
```
Header: x-webhook-secret: a1b2c3d4e5f6...
```

### 5.5 Redeploy
```bash
./deploy_fn_receive_new_project.sh
```

---

## ⚡ Step 6: Final End-to-End Test

### Test with Simulation
```bash
bash simulate_vetted_webhook.sh
```

### Ask Vetted Team to Test
Send them:
- **Webhook URL:** `https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_new_project`
- **Secret Header:** `x-webhook-secret: YOUR_SECRET`
- **Payload Format:**
  ```json
  {
    "project_id": "uuid-here",
    "project_title": "Senior AI Engineer",
    "recruiter_email": "recruiter@company.com",
    "recruiter_name": "Jane Doe"
  }
  ```

---

## 📊 Success Checklist

- [ ] Database schema applied
- [ ] Test webhook returns success
- [ ] Opportunity saved in database
- [ ] Audition URL generated correctly
- [ ] Email service integrated (Resend)
- [ ] Test email received
- [ ] Webhook secret added
- [ ] Security validation working
- [ ] Vetted team tested successfully
- [ ] Documentation updated

---

## 🆘 Troubleshooting

### "Could not find the table 'public.opportunities'"
→ Database schema not applied. Go to Step 1.

### "Email not sent"
→ Check `RESEND_API_KEY` is set in Supabase secrets.

### "Unauthorized"
→ Webhook secret doesn't match. Check header and environment variable.

### "Function not found"
→ Deploy the function: `./deploy_fn_receive_new_project.sh`

### Check Logs
```bash
# Via Supabase Dashboard
# Functions → fn_receive_new_project → Logs

# Or query via CLI
supabase functions logs fn_receive_new_project
```

---

## 📞 Support

- **Function Code:** `/congrats/supabase/functions/fn_receive_new_project/index.ts`
- **Schema File:** `/congrats/backend/supabase/schema.sql`
- **Test Script:** `/congrats/simulate_vetted_webhook.sh`
- **Deploy Script:** `/congrats/deploy_fn_receive_new_project.sh`

---

**Estimated Total Time:** 2-3 hours (including testing)

**Critical Path:** Step 1 → Step 2 → Step 4 → Step 6
