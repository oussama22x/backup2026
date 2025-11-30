# Fix Supabase Schema Cache Issues

## Problem
After running migrations, you're still seeing `PGRST205` errors: "Could not find the table 'public.jobs' in the schema cache"

This happens when Supabase's PostgREST schema cache is stale and hasn't picked up the new tables.

## Solution: Refresh Schema Cache

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to find **"Refresh Schema Cache"** or **"Reload Schema"** button
4. Click it to refresh the cache
5. Wait a few seconds for the cache to refresh

### Method 2: SQL Query
Run this in Supabase SQL Editor:

```sql
-- This will trigger a schema refresh
NOTIFY pgrst, 'reload schema';
```

### Method 3: Restart Supabase Project
1. Go to Supabase Dashboard → **Settings** → **General**
2. Click **"Restart Project"** (if available)
3. Wait for the project to restart

### Method 4: Wait and Retry
Sometimes the cache refreshes automatically after a few minutes. Try:
1. Wait 2-5 minutes
2. Refresh your browser
3. Try the operation again

## Verify Tables Exist

After refreshing the cache, verify tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('jobs', 'job_applications');

-- Should return:
-- jobs
-- job_applications
```

## Code Changes Made

The code now:
1. **Checks if tables exist** before operations
2. **Automatically refreshes schema cache** when PGRST205 errors occur
3. **Retries operations** after cache refresh
4. **Provides clear error messages** with instructions

## If Still Not Working

1. **Verify migration ran successfully:**
   ```sql
   SELECT * FROM public.jobs LIMIT 1;
   SELECT * FROM public.job_applications LIMIT 1;
   ```

2. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('jobs', 'job_applications');
   ```

3. **Verify you're connected to the correct project:**
   - Check your `.env` file for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Ensure they match your Supabase project

4. **Contact Supabase Support** if the issue persists

