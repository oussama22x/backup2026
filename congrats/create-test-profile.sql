-- Create test profile data for testing the profile data feature
-- Run this in Congrats Supabase SQL Editor

-- First, find a user_id from an existing submission
-- Replace 'YOUR_USER_ID_HERE' with an actual user_id from audition_submissions

-- Option 1: Update existing profile (if one exists)
UPDATE talent_profiles SET
    years_of_experience = 5,
    desired_salary_min = 80000,
    desired_salary_max = 120000,
    availability_date = '2025-01-15',
    github_url = 'https://github.com/testuser',
    desired_role = 'Senior Backend Engineer',
    location = 'San Francisco, CA',
    linkedin_url = 'https://linkedin.com/in/testuser',
    portfolio_url = 'https://portfolio-example.com',
    bio = 'Experienced backend engineer specializing in TypeScript and Supabase',
    is_profile_complete = true,
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Option 2: Insert new profile (if none exists)
-- Uncomment and use this if the user doesn't have a profile yet:
/*
INSERT INTO talent_profiles (
    user_id,
    first_name,
    last_name,
    years_of_experience,
    desired_salary_min,
    desired_salary_max,
    availability_date,
    github_url,
    desired_role,
    location,
    linkedin_url,
    portfolio_url,
    bio,
    is_profile_complete
) VALUES (
    'YOUR_USER_ID_HERE',
    'Test',
    'User',
    5,
    80000,
    120000,
    '2025-01-15',
    'https://github.com/testuser',
    'Senior Backend Engineer',
    'San Francisco, CA',
    'https://linkedin.com/in/testuser',
    'https://portfolio-example.com',
    'Experienced backend engineer specializing in TypeScript and Supabase',
    true
);
*/

-- Verify the profile was created/updated
SELECT 
    user_id,
    years_of_experience,
    desired_salary_min,
    desired_salary_max,
    availability_date,
    github_url,
    desired_role,
    location,
    linkedin_url,
    portfolio_url,
    bio,
    is_profile_complete
FROM talent_profiles
WHERE user_id = 'YOUR_USER_ID_HERE';
