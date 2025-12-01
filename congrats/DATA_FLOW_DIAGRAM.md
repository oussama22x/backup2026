# Data Flow: Where Profile Data is Saved & Sent

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Candidate Fills Profile                                    │
│ Location: Congrats Frontend                                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ SAVED IN: Congrats Database → talent_profiles table             │
│                                                                     │
│ Table: public.talent_profiles                                      │
│ Columns:                                                           │
│   - user_id (UUID)                                                 │
│   - first_name (TEXT)                                              │
│   - last_name (TEXT)                                               │
│   - years_of_experience (INTEGER) ← Used for experience_level      │
│   - desired_salary_min (INTEGER) ← Sent to VettedAI               │
│   - desired_salary_max (INTEGER) ← Sent to VettedAI               │
│   - availability_date (DATE) ← Sent to VettedAI                    │
│   - desired_role (TEXT) ← Sent as desired_roles array              │
│   - github_url (TEXT) ← Sent to VettedAI                           │
│   - linkedin_url (TEXT) ← Sent to VettedAI                         │
│   - portfolio_url (TEXT) ← Sent to VettedAI                        │
│   - bio (TEXT) ← Sent to VettedAI                                  │
│   - location (TEXT) ← Sent as current_city                         │
│   - phone (TEXT)                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Candidate Submits Audition                                 │
│ Location: Congrats Frontend (Audition Flow)                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ SAVED IN: Congrats Database → audition_submissions table        │
│                                                                     │
│ Table: public.audition_submissions                                 │
│ Columns:                                                           │
│   - id (UUID) ← submission_id sent to VettedAI                     │
│   - user_id (UUID)                                                 │
│   - opportunity_id (UUID) ← Links to vetted project                │
│   - questions (JSONB) ← Array of question texts                    │
│   - audio_urls (JSONB) ← Array of audio file metadata              │
│   - status (TEXT) - 'pending', 'reviewing', etc.                   │
│   - submitted_at (TIMESTAMPTZ)                                     │
│   - duration_seconds (INTEGER)                                     │
│   - ip_address (TEXT)                                              │
│   - user_agent (TEXT)                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Database Trigger Fires                                     │
│ Location: Congrats Database                                        │
│                                                                     │
│ Trigger: on_submission_completed                                   │
│ Fires: AFTER UPDATE/INSERT on audition_submissions                 │
│ When: status = 'pending_review'                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Edge Function Processes Submission                         │
│ Location: Congrats Edge Function                                   │
│ Function: fn_receive_audition_submission                           │
│                                                                     │
│ What it does:                                                      │
│ 1. Fetches submission from audition_submissions                    │
│ 2. Fetches user from auth.users                                    │
│ 3. Fetches profile from talent_profiles ← YOUR PROFILE DATA        │
│ 4. Fetches answers from audition_answers                           │
│ 5. Generates signed URLs for audio files                           │
│ 6. Constructs payload with ALL profile data                        │
│ 7. Sends to VettedAI                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 📤 DATA SENT TO VETTEDAI                                           │
│                                                                     │
│ POST https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/       │
│      fn_receive_audition_submission                                │
│                                                                     │
│ Payload Structure:                                                 │
│ {                                                                  │
│   "submission_id": "uuid",                                         │
│   "project_id": "uuid",                                            │
│   "email": "candidate@example.com",                                │
│   "name": "John Doe",                                              │
│   "profile": {                                                     │
│     "experience_level": 5,              ← from years_of_experience │
│     "desired_salary_min": 80000,        ← NUMBER type              │
│     "desired_salary_max": 120000,       ← NUMBER type              │
│     "availability_date": "2025-01-15T00:00:00.000Z", ← ISO string  │
│     "start_timing": null,                                          │
│     "work_arrangements": [],                                       │
│     "location_preferences": [],                                    │
│     "current_city": "San Francisco, CA", ← from location           │
│     "current_country": null,                                       │
│     "desired_roles": ["Senior Backend Engineer"], ← Array          │
│     "linkedin_url": "https://linkedin.com/in/...",                 │
│     "github_url": "https://github.com/...",                        │
│     "portfolio_url": "https://portfolio.com",                      │
│     "bio": "Experienced engineer..."                               │
│   },                                                               │
│   "answers": [                                                     │
│     {                                                              │
│       "question_id": "q1",                                         │
│       "question_text": "Tell us about yourself",                   │
│       "transcript": "I am a software engineer...",                 │
│       "audio_url": "https://signed-url.com/audio.mp3",             │
│       "submitted_at": "2025-12-01T10:00:00Z"                       │
│     }                                                              │
│   ]                                                                │
│ }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ❌ PROBLEM: VettedAI Function Doesn't Exist                        │
│                                                                     │
│ Current Status: 401 Error (Missing authorization header)           │
│                                                                     │
│ The function fn_receive_audition_submission doesn't exist in       │
│ VettedAI, so the data goes nowhere!                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ALTERNATIVE: Recruiter Views Shortlist (WORKS!)                    │
│                                                                     │
│ When recruiter opens VettedAI shortlist page:                      │
│ 1. Frontend calls Bridge API                                       │
│ 2. Bridge API queries Congrats DB directly                         │
│ 3. Fetches from talent_profiles table                              │
│ 4. Returns ALL profile data to VettedAI UI                         │
│                                                                     │
│ Endpoint: GET /api/shortlist/:projectId                            │
│                                                                     │
│ Response includes:                                                 │
│ {                                                                  │
│   "candidates": [                                                  │
│     {                                                              │
│       "candidate_id": "uuid",                                      │
│       "email": "candidate@example.com",                            │
│       "full_name": "John Doe",                                     │
│       "years_experience": 5,            ← NEW                      │
│       "desired_salary_min": 80000,      ← NEW                      │
│       "desired_salary_max": 120000,     ← NEW                      │
│       "availability_date": "2025-01-15", ← NEW                     │
│       "desired_role": "Senior Engineer", ← NEW                     │
│       "github_url": "https://...",      ← NEW                      │
│       "linkedin_url": "https://...",                               │
│       "portfolio_url": "https://...",                              │
│       "bio": "...",                     ← NEW                      │
│       "location": "San Francisco, CA",                             │
│       "skills": ["TypeScript", "React"],                           │
│       "responses": [ /* audio answers */ ]                         │
│     }                                                              │
│   ]                                                                │
│ }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔍 Where to See the Data

### 1. **In Congrats Database** (Supabase Dashboard)

**Database**: Congrats (uvszvjbzcvkgktrvavqe)

Run this query:
```sql
SELECT 
  tp.user_id,
  tp.first_name,
  tp.last_name,
  tp.years_of_experience,
  tp.desired_salary_min,
  tp.desired_salary_max,
  tp.availability_date,
  tp.desired_role,
  tp.github_url,
  tp.linkedin_url,
  tp.portfolio_url,
  tp.bio,
  tp.location
FROM talent_profiles tp
WHERE tp.user_id = '471ce9c7-1c28-492c-ae3b-16910318c1cc';
```

### 2. **In Edge Function Logs** (When Submission Happens)

**Location**: Congrats Supabase Dashboard → Functions → `fn_receive_audition_submission` → Logs

Look for:
```
Constructed Payload: {
  "submission_id": "...",
  "profile": {
    "experience_level": 5,
    "desired_salary_min": 80000,
    ...
  }
}
```

### 3. **In Bridge API Response** (When Recruiter Views)

**Test with curl**:
```bash
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID | jq '.candidates[0]'
```

You'll see all the profile fields in the response!

### 4. **In VettedAI Frontend** (When Running)

The shortlist page will display all candidate profile data fetched from the Bridge API.

---

## 📝 Summary

**Data Storage**:
- ✅ Saved in: `Congrats DB → talent_profiles table`
- ✅ Linked to: `audition_submissions table` via `user_id`

**Data Sending**:
- ✅ Sent from: `fn_receive_audition_submission` edge function
- ✅ Sent to: VettedAI webhook (currently 401 error - function doesn't exist)
- ✅ Alternative: Bridge API pulls data directly when recruiter views shortlist

**Data Viewing**:
- ✅ Recruiters see it in: VettedAI Shortlist page (via Bridge API)
- ✅ Format: JSON response with all profile fields

The profile data is **already flowing through the Bridge API** to recruiters! 🎉
