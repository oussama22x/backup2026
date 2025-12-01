# ✅ CHANGES COMPLETE - Ready to Deploy

## 🎉 What Was Changed

### 1. **Table Renamed:** `opportunities` → `vetted_projects`

**Reason:** 
- Old table was for auditions created IN Congrats
- New table stores projects FROM Vetted (external system)
- Links each project to the recruiter who created it

### 2. **Schema Updated**

**New `vetted_projects` table includes:**
```sql
- vetted_project_id (UUID) - Vetted's project ID
- project_title (TEXT) - Job title
- recruiter_email (TEXT) - Who created it on Vetted
- recruiter_name (TEXT) - Recruiter's name
- audition_url (TEXT) - The URL Congrats generates
- status (TEXT) - active/closed/archived
- timestamps - created_at, updated_at
- stats - total_submissions, last_submission_at
```

### 3. **Edge Function Updated**

File: `supabase/functions/fn_receive_new_project/index.ts`
- Now inserts into `vetted_projects` table
- Stores recruiter info
- Generates and saves audition URL
- ✅ **Already deployed!**

### 4. **Linked to Submissions**

`audition_submissions` table now references:
```sql
vetted_project_id → links to vetted_projects.vetted_project_id
```

So you can:
- Track which submissions belong to which project
- Show recruiter "all submissions for my projects"
- Get analytics per project

---

## 🚀 NEXT STEP: Apply the Schema (5 minutes)

### Option 1: Via Supabase Dashboard (Easiest)

1. **Open:** https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe
2. **Click:** SQL Editor (left sidebar)
3. **Copy:** The entire file `backend/supabase/schema.sql`
4. **Paste:** Into the SQL Editor
5. **Click:** Run ▶️
6. **Wait:** For success message

### Option 2: Via Supabase CLI

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats/backend
supabase db push
```

---

## 🧪 After Schema is Applied, Test It:

```bash
cd /home/oussama/Desktop/vetted-congrats-Flow0.1/congrats
bash simulate_vetted_webhook.sh
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Project received, saved to DB, and link generated",
  "data": {
    "project_id": "test-project-XXXXXXXXXX",
    "audition_url": "https://talent.vettedai.app/audition/test-project-XXXXXXXXXX/start",
    "email_sent": true,
    "db_record": "uuid-here",
    "recruiter_email": "recruiter@example.com"
  }
}
```

---

## 📊 What You Can Do Now

Once schema is applied and tested:

### 1. Track All Projects by Recruiter
```sql
SELECT * FROM vetted_projects 
WHERE recruiter_email = 'recruiter@example.com'
ORDER BY created_at DESC;
```

### 2. See All Submissions for a Project
```sql
SELECT * FROM submissions_with_projects
WHERE vetted_project_id = 'project-uuid-here';
```

### 3. Get Project Stats
```sql
SELECT 
  project_title,
  recruiter_email,
  total_submissions,
  audition_url,
  created_at
FROM vetted_projects
WHERE status = 'active'
ORDER BY total_submissions DESC;
```

---

## 📝 Files Changed

✅ `backend/supabase/schema.sql` - Updated schema
✅ `supabase/functions/fn_receive_new_project/index.ts` - Updated edge function
✅ Function deployed to production

---

## 🎯 Summary

**Before:**
```
Vetted → Webhook → Try to save in 'opportunities' → ❌ Table doesn't exist
```

**After (once you apply schema):**
```
Vetted → Webhook → Save in 'vetted_projects' → ✅ Success!
├─ Stores project details
├─ Links to recruiter
├─ Generates audition URL
└─ Returns URL to Vetted
```

---

## ⚡ Quick Action

**Right now, do this:**

1. Open Supabase Dashboard SQL Editor
2. Run `backend/supabase/schema.sql`
3. Test: `bash simulate_vetted_webhook.sh`
4. Should see: `"success": true` ✅

**Time: 5 minutes** 🚀

---

**Questions? The flow is ready - just needs the schema applied!**
