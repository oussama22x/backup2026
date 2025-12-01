-- Update profile for testing - Using the first submission's user
-- User ID: 471ce9c7-1c28-492c-ae3b-16910318c1cc

UPDATE talent_profiles SET
    years_of_experience = 5,
    desired_salary_min = 56160,
    desired_salary_max = 90000,
    availability_date = '2025-01-15',
    github_url = 'https://github.com/airesearcher',
    desired_role = 'AI Research Scientist',
    location = 'San Francisco, CA',
    linkedin_url = 'https://linkedin.com/in/airesearcher',
    portfolio_url = 'https://portfolio.example.com',
    bio = 'Experienced AI Research Scientist with 5 years of expertise in machine learning and deep learning',
    is_profile_complete = true,
    updated_at = NOW()
WHERE user_id = '471ce9c7-1c28-492c-ae3b-16910318c1cc';

-- Verify the update
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
    SUBSTRING(bio, 1, 50) as bio_preview,
    is_profile_complete
FROM talent_profiles
WHERE user_id = '471ce9c7-1c28-492c-ae3b-16910318c1cc';
