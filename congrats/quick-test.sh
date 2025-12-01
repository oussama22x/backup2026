#!/bin/bash

# Quick test with the anon key (if the function allows it)
# Replace SERVICE_KEY with your actual service role key

SUBMISSION_ID="81d388a1-1f2e-409a-8acd-b2d6a9739ebd"
PROJECT_REF="uvszvjbzcvkgktrvavqe"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/fn_receive_audition_submission"

# You need the SERVICE ROLE key (not anon key) 
# Get it from: Supabase Dashboard → Settings → API → service_role secret
SERVICE_KEY="YOUR_SERVICE_KEY_HERE"

echo "🧪 Testing Profile Data Feature"
echo "================================"
echo ""
echo "Submission ID: $SUBMISSION_ID"
echo "Function URL: $FUNCTION_URL"
echo ""
echo "📡 Calling function..."

curl -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"submission_id\": \"$SUBMISSION_ID\"}" \
  | jq '.'

echo ""
echo "✅ Check the 'profile' object above for:"
echo "  - experience_level: should be 5"
echo "  - desired_salary_min: should be 56160"
echo "  - desired_salary_max: should be 90000"
echo "  - availability_date: should be '2025-01-15T...'"
echo "  - github_url: should be 'https://github.com/airesearcher'"
echo "  - desired_roles: should be ['AI Research Scientist']"
