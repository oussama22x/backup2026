#!/bin/bash

# Test the Vetted → Congrats sync manually
# This simulates what the database webhook should do

echo "🧪 Testing Vetted → Congrats Sync"
echo "=================================="
echo ""

# You need to provide a real project ID from your Vetted database
if [ -z "$1" ]; then
    echo "Usage: $0 <project-id>"
    echo ""
    echo "Example: $0 123e4567-e89b-12d3-a456-426614174000"
    echo ""
    echo "Get a project ID from Vetted database:"
    echo "  SELECT id, role_title FROM projects ORDER BY created_at DESC LIMIT 5;"
    exit 1
fi

PROJECT_ID="$1"

echo "📋 Fetching project details from Vetted database..."

# Note: This requires SUPABASE_ACCESS_TOKEN or being logged in
# For now, we'll just use the project ID and let the function fetch the details
# The function will look up the recruiter_id from the projects table

# Build the webhook payload that Supabase would send
# Using just the project ID - the function will fetch the rest
PAYLOAD=$(cat <<EOF
{
  "type": "INSERT",
  "table": "projects",
  "schema": "public",
  "record": {
    "id": "$PROJECT_ID"
  },
  "old_record": null
}
EOF
)

echo "📦 Payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

# Get the Vetted project ref (from the deploy output)
VETTED_PROJECT_REF="lagvszfwsruniuinxdjb"
FUNCTION_URL="https://${VETTED_PROJECT_REF}.supabase.co/functions/v1/notify-congrats-new-project"

echo "🎯 Target: $FUNCTION_URL"
echo ""

# Send the request
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Success! Check Congrats database:"
    echo "   SELECT * FROM vetted_projects WHERE vetted_project_id = '$PROJECT_ID';"
else
    echo "❌ Failed. Check the error above."
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Check function logs: supabase functions logs notify-congrats-new-project"
    echo "   2. Verify project exists: SELECT * FROM projects WHERE id = '$PROJECT_ID';"
    echo "   3. Check recruiter exists for that project"
fi
echo ""
