# Troubleshooting: Jobs Table Not Found

If you're seeing "Jobs table does not exist" errors even after running the migration, check the following:

## 1. Verify Migration Was Run Successfully

Run this in your Supabase SQL Editor to check if the table exists:

```sql
-- Check if jobs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'jobs';
```

If this returns no rows, the migration wasn't applied. Re-run the migration.

## 2. Check Which Supabase Database You're Connected To

The frontend uses the Supabase URL from your `.env` file:
- Check `VITE_SUPABASE_URL` in your `.env` file
- Make sure you ran the migration on the **same Supabase project** that this URL points to

## 3. Verify Database Connection

In your browser console, check the Supabase URL in the error messages:
- The URL should match your `VITE_SUPABASE_URL`
- Example: If errors show `https://nnfjjhiajdnfmsvcecbg.supabase.co`, make sure your `.env` has the same URL

## 4. Check RLS Policies

Run this to verify RLS policies exist:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'jobs';
```

You should see:
- "Jobs are viewable by everyone" (SELECT)
- "Jobs are insertable by authenticated users" (INSERT)
- "Jobs are updatable by authenticated users" (UPDATE)

## 5. Common Issues

### Issue: Migration ran on wrong database
**Solution:** Make sure you're running migrations on the same Supabase project that your frontend connects to.

### Issue: Schema cache not refreshed
**Solution:** Sometimes Supabase needs a moment to refresh. Try:
1. Wait 30 seconds
2. Refresh your browser
3. Clear browser cache

### Issue: Wrong Supabase project
**Solution:** 
1. Check your `.env` file for `VITE_SUPABASE_URL`
2. Go to that Supabase project's dashboard
3. Run the migration there

## 6. Quick Fix: Re-run Migration

If unsure, simply re-run the migration:

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `supabase/migrations/20240101000000_create_jobs_tables.sql`
3. Click "Run"
4. Verify with: `SELECT COUNT(*) FROM jobs;` (should return 0 if empty, but no error)

## 7. Check Environment Variables

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

The URL in errors should match this exactly.

