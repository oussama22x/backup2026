#!/bin/bash

# Test Script for Profile Data Feature in fn_receive_audition_submission
# Tests that profile data is properly mapped and sent to VettedAI

set -e

echo "🧪 Testing Profile Data Feature"
echo "================================"
echo ""

PROJECT_REF="uvszvjbzcvkgktrvavqe"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/fn_receive_audition_submission"

echo "📋 Step 1: Find a submission with profile data"
echo "----------------------------------------------"
echo "Run this query in Supabase SQL Editor (Congrats DB):"
echo ""
echo "SELECT "
echo "  s.id as submission_id,"
echo "  s.user_id,"
echo "  s.vetted_project_id,"
echo "  tp.years_of_experience,"
echo "  tp.desired_salary_min,"
echo "  tp.desired_salary_max,"
echo "  tp.availability_date,"
echo "  tp.github_url,"
echo "  tp.desired_role,"
echo "  tp.location,"
echo "  tp.linkedin_url,"
echo "  tp.portfolio_url,"
echo "  tp.bio"
echo "FROM audition_submissions s"
echo "LEFT JOIN talent_profiles tp ON tp.user_id = s.user_id"
echo "WHERE s.audio_urls IS NOT NULL"
echo "ORDER BY s.submitted_at DESC"
echo "LIMIT 5;"
echo ""
echo "👉 Copy a submission_id that has profile data filled in"
echo ""
read -p "Enter submission_id to test: " SUBMISSION_ID

if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ No submission ID provided"
    exit 1
fi

echo ""
echo "📋 Step 2: Get Service Role Key"
echo "-------------------------------"
echo "Find it in: Supabase Dashboard → Settings → API → service_role secret"
echo "⚠️  KEEP THIS SECRET! Don't commit it."
echo ""
read -s -p "Enter Service Role Key: " SERVICE_KEY
echo ""

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ No service key provided"
    exit 1
fi

echo ""
echo "🚀 Step 3: Triggering Edge Function..."
echo "--------------------------------------"
echo "URL: $FUNCTION_URL"
echo "Submission ID: $SUBMISSION_ID"
echo ""

# Call the function
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"submission_id\": \"$SUBMISSION_ID\"}")

echo "📦 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check if response contains success
if echo "$RESPONSE" | grep -q '"success".*true'; then
    echo ""
    echo "✅ Function executed successfully!"
    echo ""
    echo "📊 Check the payload that was sent:"
    echo "$RESPONSE" | jq '.payload.profile' 2>/dev/null || echo "Could not parse profile data"
    echo ""
    echo "🔍 Verify these fields are NOT null:"
    echo "  - experience_level (should be a number)"
    echo "  - desired_salary_min (should be a number)"
    echo "  - desired_salary_max (should be a number)"
    echo "  - availability_date (should be ISO date string)"
    echo "  - github_url (should be URL or null)"
    echo "  - desired_roles (should be array with values)"
else
    echo ""
    echo "❌ Function returned an error"
    echo "$RESPONSE"
fi

echo ""
echo "💡 To view detailed logs:"
echo "supabase functions logs fn_receive_audition_submission --project-ref $PROJECT_REF"
echo ""
echo "📝 Note: The function sends data to VettedAI webhook."
echo "   Check VettedAI logs to verify the data arrived correctly."
