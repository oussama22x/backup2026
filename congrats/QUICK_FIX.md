# Quick Fix: Jobs Table Not Found

## The Problem
You're seeing 404 errors because the `jobs` table doesn't exist in the Supabase database your frontend is connected to.

## Most Likely Cause
You ran the migration on a **different Supabase project** than the one your frontend uses.

## Solution Steps

### Step 1: Find Your Frontend's Supabase URL

1. Check your browser console errors - they show the Supabase URL
2. Look for: `https://nnfjjhiajdnfmsvcecbg.supabase.co` (or similar)
3. This is the database your frontend is trying to connect to

### Step 2: Verify Which Database You Ran Migration On

1. Go to your Supabase Dashboard
2. Check the project URL in the browser address bar
3. Make sure it matches the URL from Step 1

### Step 3: Run Migration on Correct Database

1. Go to the **correct** Supabase project (the one matching your frontend URL)
2. Open **SQL Editor**
3. Run this verification query first:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'jobs';
   ```
4. If it returns **no rows**, the table doesn't exist - proceed to Step 4
5. If it returns a row, the table exists - check RLS policies instead

### Step 4: Run the Migration

1. Copy the **entire** contents of `supabase/migrations/20240101000000_create_jobs_tables.sql`
2. Paste into SQL Editor
3. Click **Run**
4. You should see "Success. No rows returned" or similar

### Step 5: Verify It Worked

Run this query:
```sql
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'jobs';
```

Should return: `table_exists: 1`

### Step 6: Run RLS Fix Migration

1. Copy contents of `supabase/migrations/20240101000002_fix_jobs_rls.sql`
2. Run in SQL Editor
3. Should see "Success"

### Step 7: Refresh Your App

1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Try applying to a job again
3. The errors should be gone

## Still Not Working?

Check your `.env` file:
- `VITE_SUPABASE_URL` should match the URL in browser console errors
- If they don't match, update `.env` or run migration on the correct project

