# 🔧 Fix for "Permission Denied for Table Users" Error

## Problem
When submitting a job application via `/jobs`, you get this error:
```
Error submitting application:
{error: '42501', details: null, hint: null, message: 'permission denied for table users'}
```

## Root Cause
The Row Level Security (RLS) policies on the `job_applications` table try to query `auth.users` directly:
```sql
(candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
```

Anonymous and authenticated users don't have direct permission to read from `auth.users`, causing the error.

## Solution
Use a `SECURITY DEFINER` function that runs with elevated privileges to safely access `auth.users`.

## How to Apply the Fix

### Option 1: Using Supabase SQL Editor (RECOMMENDED)

1. Open your Supabase Dashboard:
   https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe/sql/new

2. Copy the entire contents of `FIX_JOB_APPLICATION_RLS.sql` file

3. Paste it into the SQL Editor

4. Click "Run" button

5. You should see "Success. No rows returned"

6. Test the application submission - it should work now! ✅

### Option 2: Using Supabase CLI (if Docker is running)

```bash
cd /home/oussama/Desktop/monday/congrats
supabase db push
```

## What the Fix Does

1. **Drops old problematic policies** that directly query `auth.users`

2. **Creates a security definer function**:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_current_user_email()
   RETURNS TEXT
   LANGUAGE sql
   STABLE
   SECURITY DEFINER
   ```
   This function runs with elevated privileges and safely retrieves the user's email.

3. **Recreates RLS policies** using the secure function instead of direct queries

## Files Created

- `FIX_JOB_APPLICATION_RLS.sql` - The SQL script to apply (ready to copy/paste)
- `supabase/migrations/20241124000000_fix_job_applications_rls.sql` - Migration file
- `backend/apply-rls-fix-*.mjs` - Attempted automated scripts (didn't work due to API limitations)

## Testing

After applying the fix:

1. Go to: http://localhost:8080/jobs/vfaxapp-internal/marketing-trainee
2. Fill out the application form
3. Click "Submit Application"
4. You should NO LONGER see the "permission denied" error ✅
5. Application should submit successfully 🎉

## Technical Details

The fix changes this:
```sql
-- OLD (causes permission error)
(candidate_data->>'email') = (SELECT email FROM auth.users WHERE id = auth.uid())
```

To this:
```sql
-- NEW (works correctly)
(candidate_data->>'email') = public.get_current_user_email()
```

The function `get_current_user_email()` has `SECURITY DEFINER` which allows it to query `auth.users` on behalf of the user without requiring direct permissions.
