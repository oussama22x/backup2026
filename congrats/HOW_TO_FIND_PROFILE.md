# How to Find Your Profile in the Database

## Issue: "No data yet!"

If your SQL query returns no rows, it's likely because:
1. **Wrong email format** - Make sure your email includes the `@` symbol (e.g., `faithfoundrytech.com` should be `yourname@faithfoundrytech.com`)
2. **RLS blocking** - Row Level Security might be blocking your query if you're not logged in as that user
3. **Wrong user_id** - The user_id in the query doesn't match the one in the database

## Solution: Use the Console Logs

When you fill out the profile wizard, check your browser console (F12). You'll see logs like:

```
Saving profile progress: {user_id: 'bb13dcb1-2791-4c2a-8328-89af54c651c9', ...}
🔍 To find this profile in Supabase, use this query:
SELECT * FROM public.talent_profiles WHERE user_id = 'bb13dcb1-2791-4c2a-8328-89af54c651c9';
```

**Copy that user_id and use it in the SQL query below:**

## Method 1: Query by user_id (Most Reliable)

```sql
-- Replace with the user_id from your console logs
SELECT 
    tp.*,
    u.email
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.user_id = 'bb13dcb1-2791-4c2a-8328-89af54c651c9'; -- PASTE YOUR USER_ID HERE
```

## Method 2: Query by Email (Make sure email is correct!)

```sql
-- Make sure your email includes the @ symbol!
SELECT 
    tp.*,
    u.email
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE u.email = 'yourname@faithfoundrytech.com'; -- FULL EMAIL WITH @
```

## Method 3: Check All Recent Profiles

```sql
-- See all profiles updated in the last hour
SELECT 
    tp.user_id,
    u.email,
    tp.first_name,
    tp.last_name,
    tp.wizard_step,
    tp.onboarding_completed,
    tp.updated_at,
    NOW() - tp.updated_at as time_ago
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY tp.updated_at DESC;
```

## Method 4: Check Your Own Profile (While Logged In)

If you're logged in as the user, this query uses your current session:

```sql
SELECT 
    tp.*,
    u.email
FROM public.talent_profiles tp
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.user_id = auth.uid(); -- Uses current logged-in user
```

## What to Look For

After running the query, you should see:
- `first_name` and `last_name` - Your name
- `wizard_step` - Current step (1-9)
- `onboarding_completed` - Should be `true` after clicking "Finish Profile"
- `updated_at` - When the profile was last updated

## If Still No Data

1. **Check the console logs** - Look for any error messages
2. **Verify RLS policies** - Make sure you have permission to read `talent_profiles`
3. **Check if profile exists** - Run Method 3 to see all recent profiles
4. **Verify user exists** - Check if your user exists in `auth.users`:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%@faithfoundrytech.com';
```

