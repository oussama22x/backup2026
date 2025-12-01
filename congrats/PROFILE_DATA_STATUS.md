# Profile Data Feature - Implementation Status

## ✅ Summary

**Status**: **PARTIALLY IMPLEMENTED** - needs completion

The profile data feature exists in `fn_receive_audition_submission` but many fields are marked as `null` or empty arrays with comments saying "Not in schema".

## 📊 Current vs Required Mapping

### Database Schema Available (`talent_profiles` table)
```sql
- first_name TEXT
- last_name TEXT
- bio TEXT
- location TEXT  
- phone TEXT
- linkedin_url TEXT
- github_url TEXT
- portfolio_url TEXT
- years_of_experience INTEGER
- desired_role TEXT
- desired_salary_min INTEGER ✅
- desired_salary_max INTEGER ✅
- availability_date DATE ✅
- is_profile_complete BOOLEAN
```

### Current Implementation in `fn_receive_audition_submission`

```typescript
profile: {
    experience_level: profile?.years_experience || null,  // ❌ Wrong field
    desired_salary_min: null,  // ❌ Should map from profile
    desired_salary_max: null,  // ❌ Should map from profile
    availability_date: null,  // ❌ Should map from profile
    start_timing: null,  // ❌ Needs mapping logic
    work_arrangements: [],  // ⚠️ Not in DB
    location_preferences: [],  // ⚠️ Not in DB
    current_city: profile?.location || null,  // ✅ Already mapped
    current_country: null,  // ⚠️ Not in DB
    desired_roles: [],  // ❌ Should map from profile.desired_role
    linkedin_url: profile?.linkedin_url || null,  // ✅ Already mapped
    github_url: null,  // ❌ Should map from profile
    portfolio_url: profile?.portfolio_url || null,  // ✅ Already mapped
    bio: profile?.bio || null,  // ✅ Already mapped
}
```

## 🔧 Required Changes

### 1. Fix Existing Field Mappings
- ❌ `experience_level`: Uses wrong field name `years_experience` → should be `years_of_experience`
- ❌ `desired_salary_min`: Should map from `profile.desired_salary_min`
- ❌ `desired_salary_max`: Should map from `profile.desired_salary_max`
- ❌ `availability_date`: Should map from `profile.availability_date`
- ❌ `github_url`: Should map from `profile.github_url`
- ❌ `desired_roles`: Should map from `profile.desired_role` (convert to array)

### 2. Missing Database Columns
These fields are required by VettedAI's spec but NOT in the database:
- `start_timing` (String - "Immediately", "Within 2 weeks", etc.)
- `work_arrangements` (Array - ["Remote", "Hybrid", "Onsite"])
- `location_preferences` (Array - cities/countries)
- `current_country` (String)

### 3. Database Query Issue
The function currently queries:
```typescript
const { data: profile } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", submission.user_id)
    .single();
```

But the query uses `years_experience` which doesn't exist. The correct column is `years_of_experience`.

## 📝 Implementation Checklist

### Phase 1: Fix Existing Mappings (Quick Win)
- [ ] Fix `experience_level` mapping: `profile?.years_of_experience` 
- [ ] Add `desired_salary_min` mapping: `profile?.desired_salary_min` (ensure Number type)
- [ ] Add `desired_salary_max` mapping: `profile?.desired_salary_max` (ensure Number type)
- [ ] Add `availability_date` mapping: `profile?.availability_date` (convert Date to ISO string)
- [ ] Add `github_url` mapping: `profile?.github_url`
- [ ] Add `desired_roles` mapping: `profile?.desired_role ? [profile.desired_role] : []`

### Phase 2: Add Missing Database Columns (If Needed)
Options:
1. **Add to `talent_profiles` table**:
   ```sql
   ALTER TABLE public.talent_profiles 
   ADD COLUMN start_timing TEXT,
   ADD COLUMN work_arrangements TEXT[], -- PostgreSQL array
   ADD COLUMN location_preferences TEXT[],
   ADD COLUMN current_country TEXT;
   ```

2. **OR use placeholder/derived values**:
   - `start_timing`: Derive from `availability_date` (if date is soon → "Immediately")
   - `work_arrangements`: Default to empty array `[]`
   - `location_preferences`: Parse from `location` field or use empty array
   - `current_country`: Parse from `location` field if it contains country

### Phase 3: Type Safety
- [ ] Ensure `desired_salary_min/max` sent as **Numbers**, not strings
- [ ] Ensure arrays sent as **Arrays**, not strings
- [ ] Convert `availability_date` from Date to ISO string format

## 🎯 Recommended Action

**Option A: Quick Fix (Recommended for MVP)**
1. Fix all 6 existing field mappings that have data available
2. Leave missing fields as empty/null (they're likely optional in VettedAI's API)
3. Test with real submission

**Option B: Complete Implementation**
1. Add 4 missing columns to `talent_profiles` table
2. Update frontend to collect these fields during profile creation
3. Map all 14 fields in the webhook
4. Test end-to-end

## 📄 File to Edit

**Path**: `/congrats/supabase/functions/fn_receive_audition_submission/index.ts`

**Lines**: ~105-120 (the profile object construction)

## ⚡ Quick Fix Code

Replace lines 105-120 with:
```typescript
profile: {
    experience_level: profile?.years_of_experience || null,
    desired_salary_min: profile?.desired_salary_min ? Number(profile.desired_salary_min) : null,
    desired_salary_max: profile?.desired_salary_max ? Number(profile.desired_salary_max) : null,
    availability_date: profile?.availability_date ? new Date(profile.availability_date).toISOString() : null,
    start_timing: null, // Not in DB - can be derived later
    work_arrangements: [], // Not in DB - add column or leave empty
    location_preferences: [], // Not in DB - add column or leave empty
    current_city: profile?.location || null,
    current_country: null, // Not in DB - can be parsed from location
    desired_roles: profile?.desired_role ? [profile.desired_role] : [],
    linkedin_url: profile?.linkedin_url || null,
    github_url: profile?.github_url || null,
    portfolio_url: profile?.portfolio_url || null,
    bio: profile?.bio || null,
}
```

This fixes the 6 fields we have data for and leaves the 4 missing fields as empty (VettedAI likely handles this).
