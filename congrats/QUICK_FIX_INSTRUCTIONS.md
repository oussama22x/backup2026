# Quick Fix for Persistent Schema Cache Errors

## The Problem
Even after running migrations, you're still seeing `PGRST205` errors. This is a **Supabase schema cache issue**.

## The Solution (Do This Now)

### Step 1: Run the Diagnostic Script
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the **ENTIRE** contents of `DIAGNOSE_AND_FIX.sql`
3. Click **Run** (or press Ctrl+Enter)
4. Wait for it to complete

This script will:
- ✅ Check if tables exist
- ✅ Create tables if missing
- ✅ Set up all indexes
- ✅ Configure RLS policies
- ✅ Refresh the schema cache automatically
- ✅ Verify everything works

### Step 2: Manually Refresh Schema Cache
Even after running the script, manually refresh:

1. Go to **Supabase Dashboard**
2. Navigate to **Settings** → **API**
3. Look for **"Reload Schema"** or **"Refresh Schema Cache"** button
4. Click it
5. Wait 10-15 seconds

### Step 3: Verify It Works
Run this in SQL Editor:
```sql
SELECT COUNT(*) FROM public.jobs;
SELECT COUNT(*) FROM public.job_applications;
```

Both should return `0` (or a number if you have data) - **NOT an error**.

### Step 4: Test in Browser
1. Refresh your browser (hard refresh: Ctrl+Shift+R)
2. Try submitting an application
3. Check browser console - should see no `PGRST205` errors

## If Still Not Working

### Check Your Database Connection
Verify you're connected to the correct Supabase project:

1. Check `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Make sure these match your Supabase Dashboard → Settings → API

### Check Migration History
Run this in SQL Editor:
```sql
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;
```

You should see your migration listed.

### Nuclear Option: Restart Project
1. Supabase Dashboard → Settings → General
2. Click **"Restart Project"** (if available)
3. Wait 2-3 minutes
4. Try again

## What Changed in Code

The code now:
- ✅ Handles schema cache errors gracefully
- ✅ Automatically retries after cache refresh
- ✅ Doesn't block application submission if job sync fails
- ✅ Provides better error messages

## Still Having Issues?

1. **Check browser console** for specific error codes
2. **Check Supabase logs** (Dashboard → Logs → API)
3. **Verify RLS policies** are correct
4. **Contact Supabase support** if the issue persists

The `DIAGNOSE_AND_FIX.sql` script should fix everything in one go!

