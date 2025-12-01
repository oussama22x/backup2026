#!/bin/bash

# Manually trigger submission to be sent to VettedAI
# This bypasses the database trigger and calls the edge function directly

SUBMISSION_ID="81d388a1-1f2e-409a-8acd-b2d6a9739ebd"
CONGRATS_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3ODA0NiwiZXhwIjoyMDc3MzU0MDQ2fQ.ZJRbe7DvAfwkJHOsc9aaKb4-KjkXMKB6kzA8WBOx1J0"

echo "🚀 Manually Triggering Submission to VettedAI"
echo "=============================================="
echo ""
echo "Submission ID: $SUBMISSION_ID"
echo ""
echo "📡 Calling fn_receive_audition_submission..."
echo ""

RESPONSE=$(curl -s -X POST "https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_audition_submission" \
  -H "Authorization: Bearer $CONGRATS_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"submission_id\": \"$SUBMISSION_ID\"}")

echo "📦 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check result
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ SUCCESS! Submission sent to VettedAI"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Go to VettedAI dashboard"
    echo "  2. Navigate to the project shortlist"
    echo "  3. You should see the candidate appear!"
elif echo "$RESPONSE" | grep -q "Missing or invalid project_id"; then
    echo ""
    echo "⚠️  Submission needs a valid project_id"
    echo ""
    echo "Let's check the submission's project link..."
    echo ""
    echo "Run this in Congrats Supabase SQL Editor:"
    echo ""
    echo "SELECT s.id, s.opportunity_id, vp.vetted_project_id"
    echo "FROM audition_submissions s"
    echo "LEFT JOIN vetted_projects vp ON vp.id = s.opportunity_id"
    echo "WHERE s.id = '$SUBMISSION_ID';"
else
    echo ""
    echo "❌ Error occurred:"
    echo "$RESPONSE"
fi
