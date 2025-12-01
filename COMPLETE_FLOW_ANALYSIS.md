# 🔍 Complete Project Flow Analysis - Vetted & Congrats

## 📊 Overview

You have **TWO SEPARATE SYSTEMS** in this workspace:

### 1. **VETTED** - Recruiter Platform (Question Generation & Vetting Setup)
- **Purpose:** Recruiters create job postings and AI generates custom audition questions
- **Database:** Separate Supabase project for vetted
- **URL:** `https://lagvszfwsruniuinxdjb.supabase.co`

### 2. **CONGRATS** - Candidate Platform (Audition Taking System)
- **Purpose:** Candidates take auditions by answering video questions
- **Database:** Separate Supabase project for congrats
- **Users:** Job seekers/candidates

---

## 🎯 VETTED PROJECT - Complete A to Z Flow

### Phase 1: User Onboarding

```
1. Recruiter Signs Up
   ├─ POST /auth/v1/signup
   ├─ Creates record in: auth.users
   ├─ Trigger: handle_new_user() function
   └─ Creates record in: public.recruiters table
      ├─ Columns: user_id, full_name, email, company_name, user_role, company_size, referral_source
      └─ Status: 'active'
```

**Database Tables Involved:**
- `auth.users` - Authentication (Supabase Auth)
- `public.recruiters` - Extended profile info
- `public.user_roles` - Role assignments (admin, ops_manager, etc.)
- `public.admin_whitelist` - Auto-admin email list

### Phase 2: Project Creation (Job Description Upload)

```
2. Recruiter Creates Project
   ├─ Page: /workspace/new/jd-upload
   ├─ User pastes or uploads JD (PDF/DOCX/TXT)
   ├─ Edge Function: parse-job-description
   │  ├─ Parses JD with AI
   │  └─ Extracts: role_title, company_name, job_summary, key_skills
   ├─ Function: create_draft_project_v3()
   └─ Creates record in: public.projects
      ├─ Columns: recruiter_id, role_title, company_name, job_description, job_summary
      ├─ Status: 'pending_activation'
      └─ Returns: project_id (UUID)
```

**Database Tables:**
- `public.projects` - Main project/role records

**Storage:**
- JD text stored as `job_description` column (text)
- Parsed data: `role_title`, `job_summary`, `company_name`

### Phase 3: Role Definition Generation (AI Analysis)

```
3. AI Generates Role Definition
   ├─ Page: /workspace/new/generate-role-definition
   ├─ Edge Function: fn_generate_role_definition
   │  ├─ Analyzes JD with Gemini AI
   │  ├─ Extracts role context:
   │  │  ├─ Goals, stakeholders, decision_horizon, tools, KPIs, constraints
   │  │  ├─ Cognitive_type, team_topology, cultural_tone
   │  │  └─ Context flags: role_family, seniority, is_startup, is_people_mgmt
   │  └─ Calculates weighted_dimensions:
   │     ├─ cognitive: 0.25
   │     ├─ execution: 0.20
   │     ├─ communication_collaboration: 0.15
   │     ├─ adaptability_learning: 0.15
   │     ├─ emotional_intelligence: 0.15
   │     └─ judgment_ethics: 0.10
   └─ Saves to: public.role_definitions
      ├─ Columns: project_id (FK), definition_data (JSONB)
      └─ JSONB Structure:
         {
           "definition_data": {...},
           "context_flags": {...},
           "clarifier_inputs": {...},
           "weighted_dimensions": {
             "weights": {...},
             "rationale": "...",
             "bank_id": "software_engineer_senior"
           },
           "candidate_facing_jd": {...}
         }
```

**Database Tables:**
- `public.role_definitions` - AI-generated role analysis (JSONB)

**Key Concept: Weighted Dimensions**
- AI determines which performance dimensions matter most for this role
- Total weights = 1.0 (100%)
- Used to determine question distribution

### Phase 4: Question Generation (Master Bank)

```
4. Question Bank Generation
   ├─ Page: /workspace/new/generate-audition
   ├─ Edge Function: fn_ai_question_factory
   │  ├─ Takes role_definition (weighted_dimensions)
   │  ├─ Fetches archetypes from: public.archetypes table
   │  │  ├─ 6 dimensions × multiple archetypes each
   │  │  └─ Each archetype has: logic_prompt, behavioral_anchors, duration
   │  ├─ Generates 15 questions PER DIMENSION (90 total)
   │  │  ├─ Uses Lovable AI API for question generation
   │  │  ├─ Parameterizes prompts with role context
   │  │  └─ Each question has: question_id, dimension, archetype_id, question_text, duration_seconds, quality_score
   │  └─ Saves to: public.role_master_banks
   │     ├─ Columns: bank_id (PK), role_family, seniority_level, questions (JSONB), status
   │     ├─ bank_id format: "{role_family}_{seniority}" (e.g., "software_engineer_senior")
   │     ├─ questions: Array of 90 question objects
   │     └─ Status: 'GENERATING' → 'READY' | 'FAILED'
   └─ Caching: If bank_id exists and status='READY', reuse it!
```

**Database Tables:**
- `public.archetypes` - Question templates/blueprints
  - Columns: `dimension`, `archetype_id`, `logic_prompt`, `behavioral_anchors`, `parameters_needed`, `duration_seconds`
  - Example archetypes: "cognitive_tradeoff", "execution_prioritization", "emotional_conflict_resolution"
  
- `public.role_master_banks` - Cached question banks
  - Columns: `bank_id` (PK), `role_family`, `seniority_level`, `questions` (JSONB array), `status`, `created_at`
  - One bank per role+seniority combination
  - Contains 90 questions (15 per dimension)

**Question Storage Structure (in JSONB):**
```json
{
  "questions": [
    {
      "question_id": "uuid-1234",
      "dimension": "cognitive",
      "archetype_id": "cognitive_tradeoff",
      "question_text": "You need to decide between...",
      "duration_seconds": 120,
      "quality_score": 0.85,
      "context_used": {
        "metric A": "user engagement",
        "deliverable": "product launch"
      },
      "generated_at": "2025-11-18T10:30:00Z"
    }
    // ... 89 more questions
  ]
}
```

### Phase 5: Audition Scaffold (Question Selection)

```
5. Select Final Questions for Audition
   ├─ Edge Function: fn_generate_audition_scaffold
   ├─ Takes: role_definition + question bank
   ├─ Selects 10 questions from 90:
   │  ├─ 5 "Core" questions (from top 3 weighted dimensions)
   │  └─ 5 "Variable" questions (from remaining dimensions)
   ├─ Algorithm: Seeded shuffle for determinism
   │  ├─ Ensures diversity across archetypes
   │  ├─ Uses project_id as seed (same project = same questions)
   │  └─ Balances quality_score vs archetype coverage
   └─ Saves to: public.audition_scaffolds
      ├─ Columns: role_definition_id (FK), scaffold_data (JSONB), scaffold_preview_html, version
      └─ scaffold_data structure:
         {
           "bank_id": "software_engineer_senior",
           "cache_hit": true,
           "questions": [ ... 10 selected questions ... ],
           "generated_at": "timestamp"
         }
```

**Database Tables:**
- `public.audition_scaffolds` - Final 10 questions for a project
  - Links to: `role_definitions` table
  - Versioned (can regenerate if needed)
  - Contains preview HTML for recruiter

**Key Point:** Questions are stored TWICE:
1. In `role_master_banks` - Full 90-question bank (cached, reusable)
2. In `audition_scaffolds` - Selected 10 questions (project-specific)

### Phase 6: Candidate Management

```
6. Recruiter Uploads Candidate Resumes
   ├─ Page: /workspace/projects/{id}/candidates
   ├─ Uploads: PDF/DOCX resumes
   └─ Saves to:
      ├─ storage.objects bucket: 'resumes'
      └─ public.talent_profiles table
         ├─ Columns: project_id (FK), file_name, file_path, parsed_name, parsed_email, status
         └─ Links candidate to project
```

**Database Tables:**
- `public.talent_profiles` - Uploaded candidate resumes

**Storage Buckets:**
- `resumes` - Resume files (PDFs, DOCX)

### Phase 7: Project Activation & Candidate Invitations

```
7. Activate Project & Send Invitations
   ├─ Status change: 'pending_activation' → 'awaiting_network_match'
   ├─ Trigger: notify_sourcing_request_trigger()
   │  └─ Calls Edge Function: fn_notify_sourcing_request
   │     └─ Sends Slack notification to ops team
   └─ Updates: public.notification_log
      ├─ Records notification delivery
      └─ Status: 'pending' → 'sent' | 'failed'
```

**Database Tables:**
- `public.notification_log` - Webhook tracking
- `public.analytics_events` - Event tracking

---

## 🎯 CONGRATS PROJECT - Complete A to Z Flow

### System Architecture

**CONGRATS is the CANDIDATE-FACING AUDITION PLATFORM**

```
Candidate Journey:
Browse Jobs → Apply → Take Audition → Submit Video Responses
```

### Database Schema - CONGRATS

```
CONGRATS Supabase Project Tables:

1. opportunities (Job Listings)
   ├─ id (UUID, PK)
   ├─ title (TEXT) - "Backend Engineer"
   ├─ company (TEXT) - "Vetted AI"
   ├─ location (TEXT) - "Remote (Global)"
   ├─ type (TEXT) - "Full-time", "Contract"
   ├─ rate (TEXT) - "$80-100/hr"
   ├─ skills (JSONB) - ["Node.js", "Supabase", "PostgreSQL"]
   ├─ questions (JSONB) - Array of question strings
   ├─ status (TEXT) - "active", "closed", "draft"
   ├─ created_at (TIMESTAMP)
   └─ closes_at (TIMESTAMP)

2. audition_submissions (Candidate Responses)
   ├─ id (UUID, PK)
   ├─ user_id (UUID, FK to auth.users)
   ├─ opportunity_id (UUID, FK to opportunities)
   ├─ questions (JSONB) - Array of questions answered
   ├─ audio_urls (JSONB) - Array of {question_index, audio_url, file_path}
   ├─ status (TEXT) - "pending", "reviewing", "approved", "rejected"
   ├─ submitted_at (TIMESTAMP)
   ├─ duration_seconds (INTEGER)
   └─ UNIQUE(user_id, opportunity_id) - One submission per user per job

3. proctoring_snapshots (Camera Monitoring)
   ├─ id (UUID, PK)
   ├─ submission_id (UUID, FK to audition_submissions)
   ├─ snapshot_url (TEXT) - URL to camera image
   ├─ captured_at (TIMESTAMP)
   └─ metadata (JSONB) - Device info, etc.
```

### Congrats Flow

```
1. Candidate Browses Opportunities
   ├─ Page: /opportunities or /
   ├─ Query: SELECT * FROM opportunities WHERE status = 'active'
   └─ Displays: Job cards with title, company, skills

2. Candidate Starts Audition
   ├─ Page: /audition/{opportunity_id}
   ├─ Loads: opportunity.questions (JSONB array)
   ├─ Enables: Background camera monitoring
   └─ Shows: Questions one by one

3. Candidate Records Answers
   ├─ Component: AuditionQuestionScreen.tsx
   ├─ Records: Audio using MediaRecorder API
   ├─ Captures: Camera snapshots every N seconds
   └─ Stores locally: Blob data until submission

4. Candidate Submits Audition
   ├─ Edge Function: upload-vetting-audio
   ├─ Uploads to storage: 'audition-recordings' bucket
   │  ├─ Folder structure: {user_id}/{submission_id}/
   │  └─ Files: audio_q1.webm, audio_q2.webm, ...
   ├─ Uploads snapshots: Camera images
   ├─ Creates record in: audition_submissions
   │  └─ audio_urls: [
   │       {"question_index": 0, "audio_url": "...", "file_path": "..."},
   │       {"question_index": 1, "audio_url": "...", "file_path": "..."}
   │     ]
   └─ Creates records in: proctoring_snapshots (multiple)
```

**Storage Buckets (CONGRATS):**
- `audition-recordings` - Video/audio responses
- (possibly) `proctoring-snapshots` - Camera images

---

## 📦 WHERE EVERYTHING IS STORED

### VETTED Database (Supabase Project: lagvszfwsruniuinxdjb)

| Data Type | Storage Location | Table/Bucket | Format |
|-----------|------------------|--------------|--------|
| **User Auth** | Database | `auth.users` | Standard Auth |
| **Recruiter Profiles** | Database | `public.recruiters` | Row per recruiter |
| **Projects/Roles** | Database | `public.projects` | Row per project |
| **Job Descriptions** | Database | `public.projects.job_description` | TEXT column |
| **Role Analysis** | Database | `public.role_definitions.definition_data` | JSONB |
| **Question Archetypes** | Database | `public.archetypes` | Rows (templates) |
| **Question Banks** | Database | `public.role_master_banks.questions` | JSONB array (90 questions) |
| **Final Questions** | Database | `public.audition_scaffolds.scaffold_data` | JSONB (10 questions) |
| **Candidate Resumes** | Storage | `resumes` bucket | PDF/DOCX files |
| **Resume Metadata** | Database | `public.talent_profiles` | Row per resume |

### CONGRATS Database (Separate Supabase Project)

| Data Type | Storage Location | Table/Bucket | Format |
|-----------|------------------|--------------|--------|
| **Job Listings** | Database | `public.opportunities` | Row per job |
| **Questions** | Database | `public.opportunities.questions` | JSONB array |
| **Candidate Submissions** | Database | `public.audition_submissions` | Row per submission |
| **Video/Audio Responses** | Storage | `audition-recordings` bucket | WebM/MP4 files |
| **Camera Snapshots** | Storage | (bucket) OR Database | Images |
| **Snapshot Metadata** | Database | `public.proctoring_snapshots` | Row per snapshot |

---

## 🔑 Key Concepts Explained

### 1. **Bank ID System**
```
bank_id = "{role_family}_{seniority_level}"

Examples:
- "software_engineer_senior"
- "product_manager_mid"
- "data_scientist_junior"

Purpose: Cache question banks for reuse across similar roles
```

### 2. **Question Generation Pipeline**
```
1. Archetypes (Templates in DB)
   ↓
2. Role Definition (AI Analysis)
   ↓
3. AI Question Generation (90 questions)
   ↓
4. Master Bank (Cached in DB)
   ↓
5. Question Selection (10 questions)
   ↓
6. Audition Scaffold (Final Set)
```

### 3. **Weighted Dimensions**
```
AI calculates importance of 6 performance dimensions:

1. cognitive (problem-solving, analysis)
2. execution (getting things done)
3. communication_collaboration (teamwork)
4. adaptability_learning (flexibility)
5. emotional_intelligence (empathy, self-awareness)
6. judgment_ethics (decision quality, integrity)

Total weight = 1.0 (100%)

Example for Senior Software Engineer:
- cognitive: 0.30 (30%)
- execution: 0.25 (25%)
- communication: 0.15 (15%)
- adaptability: 0.15 (15%)
- emotional: 0.10 (10%)
- judgment: 0.05 (5%)
```

### 4. **Question Distribution**
```
From 90 questions in master bank:
- 15 questions per dimension

Final selection (10 questions):
- 5 "Core" questions (top 3 weighted dimensions)
- 5 "Variable" questions (remaining dimensions)

Ensures balanced coverage while emphasizing role priorities
```

### 5. **JSONB Storage Benefits**
```
Why use JSONB?

✅ Flexible schema (role definitions evolve)
✅ Fast queries (indexed, efficient)
✅ Single read (all questions in one query)
✅ Versioning (keep old & new formats)
✅ Rich queries (query within JSON)

Example Query:
SELECT questions->'questions' FROM role_master_banks 
WHERE bank_id = 'software_engineer_senior';
```

---

## 🔄 Integration Between Systems

### How VETTED and CONGRATS Connect

```
POTENTIAL INTEGRATION (Not currently implemented):

1. Recruiter creates project in VETTED
   ↓
2. Questions generated and stored in VETTED
   ↓
3. [MANUAL STEP] Export questions from VETTED
   ↓
4. [MANUAL STEP] Create opportunity in CONGRATS
   ↓
5. Candidate takes audition in CONGRATS
   ↓
6. [MANUAL STEP] Review submissions
   ↓
7. Shortlist candidates

FUTURE: API bridge to auto-sync opportunities from VETTED → CONGRATS
```

**Current State:** 
- Two separate systems
- Manual transfer of questions
- No direct database connection

---

## 🎨 Visual Flow Summary

```
VETTED SYSTEM:
┌──────────────┐
│   Recruiter  │
│   Signs Up   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Upload Job   │
│ Description  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  AI Analyzes JD      │
│  (role_definitions)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Generate 90 Questions│
│ (role_master_banks)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Select 10 Questions  │
│ (audition_scaffolds) │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Upload Candidates &  │
│ Send Invitations     │
└──────────────────────┘

CONGRATS SYSTEM:
┌──────────────┐
│  Candidate   │
│ Browses Jobs │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Starts Audition  │
│ (opportunities)  │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ Answers Questions    │
│ (records video/audio)│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│ Submits Audition         │
│ (audition_submissions)   │
└──────────────────────────┘
```

---

## 📝 Database Query Examples

### VETTED Queries

```sql
-- Get all questions for a project
SELECT 
  p.role_title,
  rd.definition_data,
  asc.scaffold_data
FROM projects p
JOIN role_definitions rd ON rd.project_id = p.id
JOIN audition_scaffolds asc ON asc.role_definition_id = rd.id
WHERE p.id = '{project_id}';

-- Get question bank for a role
SELECT questions 
FROM role_master_banks 
WHERE bank_id = 'software_engineer_senior' 
AND status = 'READY';

-- Count questions by dimension in a bank
SELECT 
  bank_id,
  jsonb_array_length(questions->'questions') as total_questions
FROM role_master_banks
WHERE status = 'READY';
```

### CONGRATS Queries

```sql
-- Get all active jobs with questions
SELECT 
  id,
  title,
  company,
  questions,
  jsonb_array_length(questions) as question_count
FROM opportunities
WHERE status = 'active';

-- Get candidate submission with audio files
SELECT 
  u.email as candidate_email,
  o.title as job_title,
  sub.audio_urls,
  sub.submitted_at,
  sub.status
FROM audition_submissions sub
JOIN opportunities o ON o.id = sub.opportunity_id
JOIN auth.users u ON u.id = sub.user_id
WHERE sub.user_id = '{user_id}';
```

---

## 🎯 Summary

### Questions Storage Hierarchy

```
1. ARCHETYPES (Templates)
   ↓
2. ROLE_MASTER_BANKS (90 questions per role+seniority)
   ↓
3. AUDITION_SCAFFOLDS (10 selected questions per project)
   ↓
4. OPPORTUNITIES (Questions copied to CONGRATS for candidates)
   ↓
5. AUDITION_SUBMISSIONS (Candidate answers with audio/video)
```

### Key Files

**VETTED:**
- Schema: `/vetted/schema.sql`
- Edge Functions:
  - `/vetted/supabase/functions/fn_ai_question_factory/` - Generates 90 questions
  - `/vetted/supabase/functions/fn_generate_audition_scaffold/` - Selects final 10
  - `/vetted/supabase/functions/fn_generate_role_definition/` - Analyzes JD

**CONGRATS:**
- Schema: `/congrats/backend/supabase/schema.sql`
- Components:
  - `/congrats/src/components/vetting/VettingChallengeDrawer.tsx` - Audition UI
  - `/congrats/src/pages/AuditionQuestionScreen.tsx` - Question answering

---

## 💡 Quick Reference

| Question Type | Table | Count | Purpose |
|--------------|-------|-------|---------|
| Templates | `archetypes` | ~30-40 | Question blueprints |
| Full Bank | `role_master_banks` | 90 per role | Cached reusable questions |
| Selected | `audition_scaffolds` | 10 per project | Final audition questions |
| For Candidates | `opportunities.questions` | Variable | CONGRATS job listings |

**ALL QUESTIONS** ultimately originate from:
1. `archetypes` table (templates)
2. Generated via AI using `fn_ai_question_factory`
3. Stored in `role_master_banks` (cached)
4. Selected into `audition_scaffolds` (project-specific)
5. Copied to `opportunities` (CONGRATS)
