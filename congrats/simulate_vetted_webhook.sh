#!/bin/bash

# Simulate Vetted Webhook Call to fn_receive_new_project
# This script sends a payload to the Edge Function as if it came from VettedAI

# Configuration
# Replace with your actual project ref if different
PROJECT_REF="uvszvjbzcvkgktrvavqe" 
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/fn_receive_new_project"
# You can override this with an argument
if [ ! -z "$1" ]; then
  FUNCTION_URL="$1"
fi

# Generate a valid UUID for testing
TEST_PROJECT_ID=$(uuidgen 2>/dev/null || echo "$(printf '%08x-%04x-%04x-%04x-%012x' $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM)")

# Payload
PAYLOAD=$(cat <<EOF
{
  "project_id": "$TEST_PROJECT_ID",
  "project_title": "Senior AI Engineer (Simulation)",
  "recruiter_email": "recruiter@example.com",
  "recruiter_name": "Jane Doe"
}
EOF
)

echo "🚀 Simulating Vetted Webhook Call..."
echo "Target URL: $FUNCTION_URL"
echo "Payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

# Send Request
# Note: We use the ANON key usually, but for this function it might be public or require a specific header.
# Assuming it's open or uses standard Supabase auth.
# If you have the ANON_KEY in env, use it. Otherwise, we'll try without or ask user.

# Attempt to read ANON_KEY from .env if available (simple grep)
ANON_KEY=$(grep "SUPABASE_ANON_KEY" .env | cut -d '=' -f2 | tr -d '"')

if [ -z "$ANON_KEY" ]; then
  echo "⚠️  SUPABASE_ANON_KEY not found in .env. Request might fail if auth is required."
  echo "You can provide it as the second argument to this script."
  if [ ! -z "$2" ]; then
    ANON_KEY="$2"
  fi
fi

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD")

echo "📦 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Simulation request sent."
echo "Check the 'opportunities' table to see if '$TEST_PROJECT_ID' was inserted."
