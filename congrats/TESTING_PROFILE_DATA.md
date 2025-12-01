# Testing Profile Data Feature - Step by Step Guide

## Quick Test Steps

### 1️⃣ Check for Existing Test Data

Run this in **Congrats Supabase SQL Editor**:
```sql
-- See: check-test-data.sql
SELECT 
  s.id as submission_id,
  s.user_id,
  tp.years_of_experience,
  tp.desired_salary_min,
  tp.desired_salary_max,
  tp.desired_role
FROM audition_submissions s
LEFT JOIN talent_profiles tp ON tp.user_id = s.user_id
WHERE s.audio_urls IS NOT NULL
ORDER BY s.submitted_at DESC
LIMIT 5;
```

### 2️⃣ Create Test Profile Data (if needed)

If the query above shows NULL values for profile fields:

1. Copy a `user_id` from the results
2. Run `create-test-profile.sql` (replace `YOUR_USER_ID_HERE` with the actual user_id)

### 3️⃣ Run the Test Script

```bash
./test-profile-data.sh
```

The script will:
- ✅ Ask you for a submission_id (from step 1)
- ✅ Ask for your service role key
- ✅ Trigger the edge function
- ✅ Show you the profile data that was sent

### 4️⃣ Verify the Results

Check that the response includes:
```json
{
  "success": true,
  "payload": {
    "profile": {
      "experience_level": 5,              // ← Should be NUMBER
      "desired_salary_min": 80000,        // ← Should be NUMBER
      "desired_salary_max": 120000,       // ← Should be NUMBER  
      "availability_date": "2025-01-15T...", // ← Should be ISO STRING
      "github_url": "https://github.com/testuser",
      "desired_roles": ["Senior Backend Engineer"], // ← Should be ARRAY
      "current_city": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/testuser",
      "portfolio_url": "https://portfolio-example.com",
      "bio": "Experienced backend engineer..."
    }
  }
}
```

### 5️⃣ Check VettedAI Logs (Optional)

The function forwards data to VettedAI. To verify it arrived:

1. Go to **VettedAI Supabase Dashboard**
2. Navigate to **Edge Functions** → `fn_receive_audition_submission`
3. Check logs for incoming webhook data

## Files Created

- ✅ `check-test-data.sql` - Query to find submissions with profile data
- ✅ `create-test-profile.sql` - Insert/update test profile data
- ✅ `test-profile-data.sh` - Automated test script

## Expected vs Before

### Before (all null):
```json
{
  "experience_level": null,
  "desired_salary_min": null,
  "desired_salary_max": null,
  "availability_date": null,
  "github_url": null,
  "desired_roles": []
}
```

### After (properly mapped):
```json
{
  "experience_level": 5,
  "desired_salary_min": 80000,
  "desired_salary_max": 120000,
  "availability_date": "2025-01-15T00:00:00.000Z",
  "github_url": "https://github.com/testuser",
  "desired_roles": ["Senior Backend Engineer"]
}
```

## Troubleshooting

**Issue**: "No submissions found"
- Create a test submission through your app
- Or use an existing submission_id

**Issue**: "All profile fields are null"
- Run `create-test-profile.sql` with a valid user_id
- Make sure the user_id matches a submission

**Issue**: "Function returned error"
- Check the error message
- Verify service role key is correct
- Check function logs: `supabase functions logs fn_receive_audition_submission`
