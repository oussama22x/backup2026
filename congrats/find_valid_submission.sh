#!/bin/bash

# Load environment variables from backend/.env
ENV_FILE="backend/.env"

if [ -f "$ENV_FILE" ]; then
    # Extract keys explicitly
    DB_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY "$ENV_FILE" | cut -d '=' -f2)
else
    echo "❌ $ENV_FILE not found."
    exit 1
fi

# Supabase Configuration
SUPABASE_URL="https://uvszvjbzcvkgktrvavqe.supabase.co"

echo "🔍 Finding a submission with answers..."

# Fetch an answer to get valid user_id and opportunity_id
echo "🔍 Fetching an answer to find valid user/opportunity pair..."
RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/audition_answers?select=user_id,opportunity_id&limit=1" \
    -H "apikey: $DB_KEY" \
    -H "Authorization: Bearer $DB_KEY")

# Extract user_id and opportunity_id
USER_ID=$(echo $RESPONSE | grep -o '"user_id":"[^"]*"' | head -n 1 | cut -d'"' -f4)
OPP_ID=$(echo $RESPONSE | grep -o '"opportunity_id":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -z "$USER_ID" ] || [ -z "$OPP_ID" ]; then
    echo "❌ No answers found in database."
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Found answer for User: $USER_ID, Opportunity: $OPP_ID"

# Now find the submission for this pair
echo "🔍 Finding submission ID..."
SUB_RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/audition_submissions?select=id&user_id=eq.$USER_ID&opportunity_id=eq.$OPP_ID&limit=1" \
    -H "apikey: $DB_KEY" \
    -H "Authorization: Bearer $DB_KEY")

SUBMISSION_ID=$(echo $SUB_RESPONSE | grep -o '"id":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ Submission not found for this user/opportunity pair."
    echo "Response: $SUB_RESPONSE"
    exit 1
fi

echo "✅ Found valid submission: $SUBMISSION_ID"

# Now trigger the function with this ID
echo "🚀 Triggering 'send-audition-to-vetted' with this ID..."

FUNCTION_KEY=$(grep SUPABASE_ANON_KEY "$ENV_FILE" | cut -d '=' -f2)

curl --http1.1 -v -i -X POST "$SUPABASE_URL/functions/v1/send-audition-to-vetted" \
    -H "Authorization: Bearer $FUNCTION_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"submission_id\": \"$SUBMISSION_ID\"}"
