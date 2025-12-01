#!/bin/bash

# Simple Test Script for send-audition-to-vetted Edge Function
# This tests the function with a real submission

set -e

echo "🧪 Testing send-audition-to-vetted Edge Function"
echo "================================================"
echo ""

# Get project details
PROJECT_REF="uvszvjbzcvkgktrvavqe"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/send-audition-to-vetted"

echo "📋 Step 1: Get a test submission ID"
echo "Run this query in your Supabase SQL Editor:"
echo ""
echo "SELECT id, user_id, opportunity_id, created_at"
echo "FROM audition_submissions"
echo "WHERE audio_urls IS NOT NULL"
echo "ORDER BY created_at DESC"
echo "LIMIT 5;"
echo ""
read -p "Enter a submission_id to test: " SUBMISSION_ID

if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ No submission ID provided"
    exit 1
fi

echo ""
echo "📋 Step 2: Get your Anon Key"
echo "Find it in: Supabase Dashboard → Settings → API → anon public"
echo ""
read -p "Enter your Anon Key: " ANON_KEY

if [ -z "$ANON_KEY" ]; then
    echo "❌ No anon key provided"
    exit 1
fi

echo ""
echo "🚀 Step 3: Calling Edge Function..."
echo "URL: $FUNCTION_URL"
echo "Submission ID: $SUBMISSION_ID"
echo ""

# Call the function
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"submission_id\": \"$SUBMISSION_ID\"}")

echo "📦 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Test complete!"
echo ""
echo "💡 To view logs:"
echo "supabase functions logs send-audition-to-vetted --tail"
