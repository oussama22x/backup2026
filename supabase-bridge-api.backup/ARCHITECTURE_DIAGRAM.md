# Vetted-Congrats System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VETTED + CONGRATS ECOSYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐                        ┌──────────────────────────┐
│      VETTED APP          │                        │      CONGRATS APP        │
│   (Recruiter Side)       │                        │   (Candidate Side)       │
├──────────────────────────┤                        ├──────────────────────────┤
│ • Upload JD              │                        │ • Browse Jobs            │
│ • Generate Questions     │◄───────────────────────┤ • Take Auditions         │
│ • Select 10 Questions    │   Job Data via API     │ • Record Responses       │
│ • View Shortlist ◄───┐   │                        │ • Submit                 │
│ • Review Candidates  │   │                        │                          │
│ • Approve/Reject     │   │                        │                          │
└──────────────────────┼───┘                        └─────────┬────────────────┘
                       │                                      │
                       │                                      │
                       │    ┌────────────────────────┐        │
                       │    │   BRIDGE API SERVER    │        │
                       │    │   (Express.js)         │        │
                       └───►├────────────────────────┤◄───────┘
                            │ GET /api/shortlist     │
                            │ GET /api/vetted/jobs   │
                            └───────┬────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ VETTED DATABASE  │  │ CONGRATS DATABASE│
         │  (Supabase A)    │  │  (Supabase B)    │
         ├──────────────────┤  ├──────────────────┤
         │ • projects       │  │ • audition_      │
         │ • role_defs      │  │   submissions    │
         │ • archetypes     │  │ • app_user       │
         │ • master_banks   │  │ • talent_        │
         │ • audition_      │  │   profiles       │
         │   scaffolds      │  │ • talent_skills  │
         │                  │  │ • talent_exp     │
         │                  │  │ • proctoring     │
         └──────────────────┘  └──────────────────┘
```

---

## Data Flow: Recruiter Creates Job

```
STEP 1: Upload Job Description
┌─────────────┐
│ Recruiter   │
│ uploads JD  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Vetted: JdUpload.tsx            │
│ ──────────────────────────      │
│ • Parse JD with AI              │
│ • Extract: title, skills, desc  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Edge Function: parse-job-desc   │
│ ──────────────────────────      │
│ • Call Gemini AI                │
│ • Generate 90 questions         │
│ • Create role_definitions       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Vetted Database                 │
│ ──────────────────────────      │
│ INSERT INTO archetypes          │
│ INSERT INTO role_master_banks   │
│   (90 questions stored here)    │
│ INSERT INTO audition_scaffolds  │
│   (10 selected questions)       │
└─────────────────────────────────┘

RESULT: Job posted with opportunity_id = "job-uuid-123"
```

---

## Data Flow: Candidate Takes Audition

```
STEP 1: Browse Jobs
┌─────────────┐
│ Candidate   │
│ browses     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Congrats: OpportunitiesPage.tsx│
│ ──────────────────────────      │
│ • Fetch from external API       │
│ • Display job cards             │
└──────┬──────────────────────────┘
       │
       │ (Candidate clicks "Apply")
       ▼
┌─────────────────────────────────┐
│ STEP 2: Start Audition          │
│ ──────────────────────────      │
│ Congrats: AuditionScreen.tsx    │
│ • Fetch 10 questions            │
│ • Enable camera (proctoring)    │
│ • Start recording               │
└──────┬──────────────────────────┘
       │
       │ (Candidate answers each question)
       ▼
┌─────────────────────────────────┐
│ STEP 3: Record Responses        │
│ ──────────────────────────      │
│ • Audio recorded via MediaRec   │
│ • Uploaded to Supabase Storage  │
│ • Speech-to-text transcription  │
│ • Proctoring snapshots taken    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ STEP 4: Submit                  │
│ ──────────────────────────      │
│ Edge Function: upload-audio     │
│ ──────────────────────────      │
│ • Save to Storage bucket        │
│ • Generate transcription        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Congrats Database               │
│ ──────────────────────────      │
│ INSERT INTO audition_submissions│
│   {                             │
│     opportunity_id: "job-123",  │
│     user_id: "candidate-456",   │
│     questions: JSONB[...],      │
│     audio_urls: JSONB[...],     │
│     status: "submitted"         │
│   }                             │
│                                 │
│ INSERT INTO proctoring_snapshots│
│   (12 photos stored)            │
└─────────────────────────────────┘

RESULT: Audition linked to job-uuid-123
```

---

## Data Flow: Recruiter Reviews Shortlist

```
STEP 1: Open Project in Vetted
┌─────────────┐
│ Recruiter   │
│ clicks      │
│ "Shortlist" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Vetted: ShortlistPage.tsx       │
│ ──────────────────────────      │
│ const data = await fetch(       │
│   `${BRIDGE_API}/api/shortlist/ │
│    ${projectId}`                │
│ )                               │
└──────┬──────────────────────────┘
       │
       │ HTTP GET Request
       ▼
┌─────────────────────────────────┐
│ Bridge API: GET /api/shortlist  │
│ ──────────────────────────      │
│ 1. Query audition_submissions   │
│    WHERE opportunity_id = 123   │
│                                 │
│ 2. Query app_user               │
│    WHERE id IN (userIds)        │
│                                 │
│ 3. Query talent_profiles        │
│    WHERE user_id IN (userIds)   │
│                                 │
│ 4. Query talent_skills          │
│    WHERE user_id IN (userIds)   │
│                                 │
│ 5. Query talent_experiences     │
│    WHERE user_id IN (userIds)   │
│                                 │
│ 6. Query proctoring_snapshots   │
│    WHERE submission_id IN (...)│
└──────┬──────────────────────────┘
       │
       │ Returns JSON
       ▼
┌─────────────────────────────────┐
│ Response to Vetted              │
│ ──────────────────────────      │
│ {                               │
│   candidates: [                 │
│     {                           │
│       candidate_id: "456",      │
│       email: "jane@ex.com",     │
│       full_name: "Jane Doe",    │
│       skills: ["PM", "Agile"],  │
│       responses: [              │
│         {                       │
│           audio_url: "...",     │
│           transcription: "..."  │
│         }                       │
│       ],                        │
│       proctoring_count: 12      │
│     }                           │
│   ]                             │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Vetted Dashboard Displays:      │
│ ──────────────────────────      │
│ ┌─────────────────────────────┐ │
│ │ Candidate: Jane Doe         │ │
│ │ Skills: PM, Agile           │ │
│ │ Location: Lagos, Nigeria    │ │
│ │ Status: Submitted           │ │
│ │                             │ │
│ │ [View Details] [Approve]    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Database Schema: Key Relationships

```
VETTED DATABASE (Supabase A)
────────────────────────────

projects (opportunities)
├─ id (UUID)
├─ title
└─ company

      ↓ has_many

role_definitions
├─ id
├─ project_id  ───► links to projects
├─ archetype_id
└─ role_type

      ↓ has_one

audition_scaffolds
├─ id
├─ role_definition_id
├─ questions (JSONB array of 10)
└─ metadata

────────────────────────────

CONGRATS DATABASE (Supabase B)
────────────────────────────

app_user
├─ id (UUID)
├─ email
└─ role (TALENT/RECRUITER)

      ↓ has_one

talent_profiles
├─ id
├─ user_id  ───► links to app_user
├─ full_name
├─ location
├─ years_experience
└─ resume_url

      ↓ has_many

talent_skills
├─ id
├─ user_id  ───► links to app_user
└─ skill_name

      ↓ has_many

talent_experiences
├─ id
├─ user_id  ───► links to app_user
├─ company
├─ title
└─ dates

      ↓ has_many

audition_submissions
├─ id
├─ user_id  ───► links to app_user
├─ opportunity_id  ───► links to Vetted projects.id
├─ questions (JSONB array)
├─ audio_urls (JSONB array)
├─ status
└─ submitted_at

      ↓ has_many

proctoring_snapshots
├─ id
├─ submission_id  ───► links to audition_submissions
├─ snapshot_url
└─ captured_at
```

---

## Bridge API: Endpoint Details

```
┌────────────────────────────────────────────────────────────┐
│ ENDPOINT: GET /api/shortlist/:projectId                    │
├────────────────────────────────────────────────────────────┤
│ PURPOSE: Get all candidates for a job                      │
│                                                            │
│ INPUT:                                                     │
│   projectId = "550e8400-e29b-41d4-a716-446655440000"      │
│                                                            │
│ QUERIES (in parallel):                                     │
│   1. audition_submissions WHERE opportunity_id = projectId │
│   2. app_user WHERE id IN (submission.user_ids)           │
│   3. talent_profiles WHERE user_id IN (user_ids)          │
│   4. talent_skills WHERE user_id IN (user_ids)            │
│   5. talent_experiences WHERE user_id IN (user_ids)       │
│   6. proctoring_snapshots WHERE submission_id IN (...)    │
│                                                            │
│ OUTPUT:                                                    │
│   {                                                        │
│     project_id: "550e8400...",                            │
│     total_submissions: 5,                                 │
│     candidates: [                                         │
│       {                                                   │
│         candidate_id: "...",                              │
│         email: "...",                                     │
│         full_name: "...",                                 │
│         skills: ["..."],                                  │
│         responses: [{audio_url, transcription}],          │
│         proctoring_snapshots_count: 12                    │
│       }                                                   │
│     ]                                                     │
│   }                                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ENDPOINT: GET /api/shortlist/:projectId/stats             │
├────────────────────────────────────────────────────────────┤
│ PURPOSE: Get aggregate statistics                          │
│                                                            │
│ QUERIES:                                                   │
│   1. audition_submissions WHERE opportunity_id = projectId │
│                                                            │
│ CALCULATIONS:                                              │
│   • Count total submissions                               │
│   • Group by status                                       │
│   • Calculate average duration                            │
│   • Calculate completion rate                             │
│                                                            │
│ OUTPUT:                                                    │
│   {                                                        │
│     total_submissions: 25,                                │
│     completed: 22,                                        │
│     in_progress: 3,                                       │
│     status_breakdown: {                                   │
│       submitted: 15,                                      │
│       shortlisted: 5,                                     │
│       approved: 2                                         │
│     },                                                     │
│     average_duration_minutes: 28,                         │
│     completion_rate: "88.00%"                             │
│   }                                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ENDPOINT: PUT /api/shortlist/.../review                   │
├────────────────────────────────────────────────────────────┤
│ PURPOSE: Update candidate review status                    │
│                                                            │
│ INPUT:                                                     │
│   {                                                        │
│     status: "approved" | "rejected" | "shortlisted",      │
│     reviewer_id: "uuid",                                  │
│     reviewer_notes: "Optional notes"                      │
│   }                                                        │
│                                                            │
│ QUERY:                                                     │
│   UPDATE audition_submissions                             │
│   SET status = 'approved',                                │
│       reviewed_at = NOW(),                                │
│       reviewer_id = 'uuid'                                │
│   WHERE opportunity_id = projectId                        │
│     AND user_id = candidateId                             │
│                                                            │
│ OUTPUT:                                                    │
│   {                                                        │
│     success: true,                                        │
│     message: "Candidate approved"                         │
│   }                                                        │
└────────────────────────────────────────────────────────────┘
```

---

## Storage Buckets

```
CONGRATS STORAGE
────────────────

audition-recordings/
├─ user-123/
│  ├─ submission-456/
│  │  ├─ response-1.mp3  ◄─── audio_urls[0]
│  │  ├─ response-2.mp3  ◄─── audio_urls[1]
│  │  └─ response-3.mp3  ◄─── audio_urls[2]
│  └─ submission-789/
│     ├─ response-1.mp3
│     └─ ...

resumes/
├─ user-123/
│  └─ resume.pdf  ◄─── talent_profiles.resume_url

proctoring-snapshots/
├─ submission-456/
│  ├─ snapshot-1.jpg  ◄─── proctoring_snapshots[0]
│  ├─ snapshot-2.jpg  ◄─── proctoring_snapshots[1]
│  └─ ...
```

---

## Authentication Flow

```
USER LOGIN
──────────

1. User enters email/password
   ↓
2. Supabase Auth verifies credentials
   ↓
3. Returns JWT token
   ↓
4. Token stored in localStorage
   ↓
5. All API requests include:
   Authorization: Bearer <token>
   ↓
6. Supabase verifies token
   ↓
7. RLS policies check permissions
   ↓
8. Data returned if authorized


EDGE FUNCTION CALLS
───────────────────

1. Frontend calls Edge Function
   ↓
2. Sends: Authorization: Bearer <token>
   ↓
3. Edge Function creates Supabase client:
   createClient(url, key, {
     global: {
       headers: { Authorization: req.headers.authorization }
     }
   })
   ↓
4. Client uses user's JWT
   ↓
5. RLS policies apply based on user's role
   ↓
6. User sees only authorized data


BRIDGE API (NO AUTH CURRENTLY)
───────────────────────────────

1. Vetted calls Bridge API
   ↓
2. Bridge API uses SERVICE ROLE KEY
   ↓
3. Bypasses all RLS policies
   ↓
4. Returns all data

⚠️  SECURITY WARNING: Add authentication before production!
```

---

## Deployment Architecture

```
DEVELOPMENT (Current)
─────────────────────

┌──────────────────┐
│ Local Machine    │
│ ───────────────  │
│ • Vetted (5173)  │
│ • Congrats (5174)│
│ • Bridge (3000)  │
└──────────────────┘
        │
        ▼
┌──────────────────┐    ┌──────────────────┐
│ Supabase Cloud   │    │ Supabase Cloud   │
│ (Vetted DB)      │    │ (Congrats DB)    │
└──────────────────┘    └──────────────────┘


PRODUCTION (Recommended)
────────────────────────

┌──────────────────┐
│ Users' Browsers  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ CDN (Vercel/Netlify)             │
│ ─────────────────────────────    │
│ • Vetted Frontend (static)       │
│ • Congrats Frontend (static)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ VPS/Cloud Server                 │
│ ─────────────────────────────    │
│ • Bridge API (Node.js)           │
│ • Nginx (reverse proxy)          │
│ • SSL/HTTPS                      │
│ • PM2 (process manager)          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐
│ Supabase Cloud   │    │ Supabase Cloud   │
│ (Vetted DB)      │    │ (Congrats DB)    │
└──────────────────┘    └──────────────────┘
```

---

This visual guide shows the complete system architecture and data flows.
