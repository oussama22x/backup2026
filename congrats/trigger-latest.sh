#!/bin/bash

# Load environment variables from backend/.env
ENV_FILE="backend/.env"

if [ -f "$ENV_FILE" ]; then
    # Extract keys explicitly to avoid issues with xargs or special chars
    DB_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY "$ENV_FILE" | cut -d '=' -f2)
    FUNCTION_KEY=$(grep SUPABASE_ANON_KEY "$ENV_FILE" | cut -d '=' -f2)
else
    echo "❌ $ENV_FILE not found. Please ensure you are in the 'congrats' directory."
    exit 1
fi

# Supabase Configuration
SUPABASE_URL="https://uvszvjbzcvkgktrvavqe.supabase.co"

echo "🔍 Finding latest submission..."

# Fetch latest submission ID
RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/audition_submissions?select=id,submitted_at,user_id&order=submitted_at.desc&limit=1" \
    -H "apikey: $DB_KEY" \
    -H "Authorization: Bearer $DB_KEY")

# Extract ID (simple grep/cut to avoid jq dependency if not installed, though jq is better)
SUBMISSION_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ No submissions found in database."
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Found latest submission: $SUBMISSION_ID"

echo "🚀 Triggering 'send-audition-to-vetted' Edge Function..."

# Call Edge Function
curl --http1.1 -v -i -X POST "$SUPABASE_URL/functions/v1/send-audition-to-vetted" \
    -H "Authorization: Bearer $FUNCTION_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"submission_id\": \"$SUBMISSION_ID\"}"

echo -e "\n\n✅ Request sent. Check the output above for success/error details."
