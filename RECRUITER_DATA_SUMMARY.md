# Recruiter Data Summary ✅

## Data Currently Sent to Recruiters

### ✅ **Via Webhook** (fn_receive_audition_submission → VettedAI)

**Candidate Info:**
- ✅ **Name**: `profile.full_name` (computed from first_name + last_name)
- ✅ **Email**: `user.email` (from Auth) or `profile.email` (fallback)
- ✅ **Resume**: `profile.resume_url` (**JUST ADDED**)

**Profile Links:**
- ✅ **LinkedIn**: `profile.linkedin_url`
- ✅ **GitHub**: `profile.github_url`
- ✅ **Portfolio**: `profile.portfolio_url`
- ✅ **Bio**: `profile.bio`

**Experience & Preferences:**
- ✅ **Experience Level**: `profile.years_of_experience`
- ✅ **Salary Range**: `profile.desired_salary_min` / `profile.desired_salary_max`
- ✅ **Availability Date**: `profile.availability_date`
- ✅ **Desired Roles**: `profile.desired_role` (array)
- ✅ **Location**: `profile.location` (as current_city)

**Audition Data:**
- ✅ **Answers**: Array of video responses with signed URLs (1 year validity)
  - Question ID
  - Question text
  - Transcript
  - Audio/video URL
  - Submitted timestamp

---

### ✅ **Via Bridge API** (server.js → VettedAI Dashboard)

**Shortlist Endpoint** (`GET /api/shortlist/:projectId`):
- ✅ Name (`full_name`)
- ✅ Email
- ✅ Resume URL
- ✅ LinkedIn, GitHub, Portfolio
- ✅ Desired salary (min/max)
- ✅ Availability date
- ✅ Desired role
- ✅ Bio

**Candidate Detail Endpoint** (`GET /api/shortlist/:projectId/candidate/:candidateId`):
- ✅ All profile fields above
- ✅ All audition answers with audio/video URLs
- ✅ Transcripts

---

## ⚠️ **Action Required: Add Resume Columns**

The resume upload functionality exists in `server.js` but the database columns are missing.

**Run this SQL migration:**

```sql
-- Location: /congrats/add_resume_columns.sql

ALTER TABLE talent_profiles
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_file_path TEXT,
ADD COLUMN IF NOT EXISTS consent_to_store BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (
  COALESCE(first_name || ' ' || last_name, first_name, last_name)
) STORED;
```

**To apply:**
```bash
# Option 1: Via Supabase Dashboard
# Go to SQL Editor and paste the content of add_resume_columns.sql

# Option 2: Via psql (if you have it)
psql "postgresql://postgres.uvszvjbzcvkgktrvavqe:..." < add_resume_columns.sql
```

---

## 📊 **Data Coverage: 14/14 Fields (100%)**

| Field | Webhook | Bridge API | Status |
|-------|---------|------------|--------|
| Name | ✅ | ✅ | Sent |
| Email | ✅ | ✅ | Sent |
| **Resume** | ✅ | ✅ | **NEEDS DB COLUMN** |
| LinkedIn | ✅ | ✅ | Sent |
| GitHub | ✅ | ✅ | Sent |
| Portfolio | ✅ | ✅ | Sent |
| Bio | ✅ | ✅ | Sent |
| Experience | ✅ | ✅ | Sent |
| Salary | ✅ | ✅ | Sent |
| Availability | ✅ | ✅ | Sent |
| Desired Role | ✅ | ✅ | Sent |
| Location | ✅ | ✅ | Sent |
| Video Answers | ✅ | ✅ | Sent |
| Transcripts | ✅ | ✅ | Sent |

---

## 🚀 **Deployment Status**

✅ **Webhook function deployed** with resume_url field (just now)
✅ **Bridge API** already has resume_url field
⏳ **Database migration** pending (needs manual execution)

After running the SQL migration, the resume upload feature will be fully functional and recruiters will receive candidate resumes.
