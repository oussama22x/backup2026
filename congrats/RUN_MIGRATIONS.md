# Database Migration Instructions

## Issue
The `jobs` table doesn't exist in the congrats database, which is causing:
- Job applications cannot be submitted
- `/jobs/vfaxapp-internal` shows blank (no jobs loaded)

## Solution
Run the following migrations in order:

### Step 1: Create Jobs Tables
1. Open your **Supabase Dashboard** for the congrats database
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20240101000000_create_jobs_tables.sql`
4. Click **Run** to execute

This will create:
- `jobs` table
- `job_applications` table
- All necessary indexes and RLS policies

### Step 2: Seed VFA × APP Jobs (Optional but Recommended)
1. In the same **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20240101000001_seed_vfaxapp_jobs.sql`
3. Click **Run** to execute

This will add 7 initial VFA × APP jobs:
- Graduate Trainee (General Track)
- Operations Trainee
- Marketing & Communications Trainee
- HR & People Trainee
- Product & Tech Trainee
- Events & Community Trainee
- Finance & Admin Trainee

### Step 3: Verify
Run this query to verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('jobs', 'job_applications')
ORDER BY table_name;
```

You should see both tables listed.

### Step 4: Verify Jobs Were Seeded
Run this query to see the seeded jobs:

```sql
SELECT slug, title, brand_source 
FROM jobs 
WHERE brand_source && ARRAY['vfa', 'app']
ORDER BY created_at;
```

You should see 7 jobs listed.

## After Running Migrations
- Job applications should work correctly
- `/jobs/vfaxapp-internal` should show the 7 seeded jobs
- All job-related features should function properly

