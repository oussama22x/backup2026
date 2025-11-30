# User Profile Storage Information

## Table: `talent_profiles`

User profiles are stored in the **`talent_profiles`** table in Supabase.

### Table Location
- **Schema**: `public`
- **Table Name**: `talent_profiles`
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `user_id` → `public.app_user(id)` → `auth.users(id)`

**Note**: The `talent_profiles` table references `app_user`, which in turn references `auth.users`. This is a two-level relationship:
- `talent_profiles.user_id` → `app_user.id`
- `app_user.id` → `auth.users.id`

### Profile Fields

The profile contains the following fields (as defined in `src/hooks/useTalentProfile.ts`):

#### Basic Information
- `id` - UUID (primary key)
- `user_id` - UUID (references auth.users)
- `first_name` - string | null
- `last_name` - string | null
- `bio` - string | null
- `phone` - string | null

#### Social Links
- `linkedin_url` - string | null
- `github_url` - string | null
- `portfolio_url` - string | null

#### Location
- `location` - string | null
- `current_city` - string | null
- `current_country` - string | null
- `location_preferences` - string[] | null

#### Career Information
- `years_of_experience` - number | null
- `experience_level` - string | null
- `desired_roles` - string[] | null
- `desired_salary_min` - number | null
- `desired_salary_max` - number | null
- `work_arrangements` - string[] | null
- `start_timing` - string | null
- `availability_date` - string | null

#### Profile Status
- `is_profile_complete` - boolean
- `onboarding_completed` - boolean
- `wizard_step` - number

#### Timestamps
- `created_at` - timestamp
- `updated_at` - timestamp

### How Profiles Are Saved

#### 1. Auto-Creation
When a user first accesses their profile, if no profile exists, one is automatically created:
- **Location**: `src/hooks/useTalentProfile.ts` (lines 52-61)
- **Method**: Auto-inserts a stub profile with just `user_id`

#### 2. Profile Wizard Updates
During the profile wizard flow:
- **Location**: `src/pages/talent/ProfileWizard.tsx`
- **Method**: `saveProgress()` function (line 96-109)
- **Updates**: Each step saves progress to `talent_profiles` table

#### 3. Direct Updates
Using the `useTalentProfile` hook:
- **Location**: `src/hooks/useTalentProfile.ts` (lines 69-91)
- **Method**: `updateProfile` mutation
- **Usage**: `updateProfile({ field: value })`

### Related Tables

#### `talent_skills`
- Stores user skills/categories
- **Location**: `src/pages/talent/ProfileWizard.tsx` (lines 129-143)
- **Relationship**: `user_id` → `talent_profiles.user_id`
- **Fields**: `user_id`, `skill_name`

### Query Examples

#### Check if profile exists
```sql
SELECT * FROM public.talent_profiles 
WHERE user_id = 'user-uuid-here';
```

#### Check profile completion status
```sql
SELECT 
  user_id,
  first_name,
  last_name,
  onboarding_completed,
  is_profile_complete,
  wizard_step
FROM public.talent_profiles
WHERE user_id = 'user-uuid-here';
```

#### Count completed profiles
```sql
SELECT COUNT(*) 
FROM public.talent_profiles 
WHERE onboarding_completed = true;
```

### RLS Policies

The `talent_profiles` table should have RLS enabled with policies allowing:
- Users to SELECT their own profile
- Users to INSERT their own profile
- Users to UPDATE their own profile

### Common Issues

1. **Profile not saving**: Check RLS policies allow UPDATE
2. **Auto-creation failing**: Check RLS policies allow INSERT
3. **Profile not found**: Verify `user_id` matches authenticated user

### Verification

To verify profiles are being saved correctly:

```sql
-- Check recent profile updates
SELECT 
  user_id,
  first_name,
  last_name,
  wizard_step,
  onboarding_completed,
  updated_at
FROM public.talent_profiles
ORDER BY updated_at DESC
LIMIT 10;

-- Check if a specific user has a profile
SELECT * FROM public.talent_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

