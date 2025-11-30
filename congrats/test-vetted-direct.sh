#!/bin/bash

# Test VettedAI API Directly
# This bypasses your Edge Function to prove the issue is the Project ID

VETTED_URL="https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_audition_submission"
VETTED_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjA0ODMsImV4cCI6MjA3ODQzNjQ4M30.kj21M-IqAu7utGr4EVDdhKB6-5Zf5UpAI0yo41Wjljw"

# The Project ID we are currently using (which is failing)
PROJECT_ID="8ee4b5fa-012e-47ce-ad25-969f11c5482e"

echo "🚀 Testing VettedAI API Directly..."
echo "URL: $VETTED_URL"
echo "Project ID: $PROJECT_ID"
echo ""

curl -X POST "$VETTED_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VETTED_KEY" \
  -H "apikey: $VETTED_KEY" \
  -d "{
    \"submission_id\": \"test-direct-curl\",
    \"project_id\": \"$PROJECT_ID\",
    \"email\": \"test@example.com\",
    \"name\": \"Test User\",
    \"answers\": [
      {
        \"question_id\": \"test_q1\",
        \"transcript\": \"This is a test answer\",
        \"audio_url\": \"https://example.com/test.mp3\"
      }
    ]
  }" -v

echo ""
echo ""
echo "---------------------------------------------------"
echo "If you see '404 Not Found' or 'Project not found',"
echo "it proves the API works but the Project ID is wrong."
