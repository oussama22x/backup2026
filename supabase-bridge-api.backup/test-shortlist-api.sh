#!/bin/bash

# Shortlist API Test Script
# Tests all endpoints with sample data

BASE_URL="http://localhost:3000"
echo "🧪 Testing Shortlist API Endpoints"
echo "=================================="
echo ""

# Test 1: Get shortlist stats (works even if no data)
echo "📊 Test 1: Get project statistics"
echo "GET /api/shortlist/:projectId/stats"
curl -s "${BASE_URL}/api/shortlist/00000000-0000-0000-0000-000000000000/stats" | jq '.'
echo ""
echo ""

# Test 2: Get shortlist for non-existent project
echo "📋 Test 2: Get shortlist (empty project)"
echo "GET /api/shortlist/:projectId"
curl -s "${BASE_URL}/api/shortlist/00000000-0000-0000-0000-000000000000" | jq '.'
echo ""
echo ""

# Test 3: Get candidate details (404 expected)
echo "👤 Test 3: Get candidate details (404 expected)"
echo "GET /api/shortlist/:projectId/candidate/:candidateId"
curl -s "${BASE_URL}/api/shortlist/00000000-0000-0000-0000-000000000000/candidate/00000000-0000-0000-0000-000000000001" | jq '.'
echo ""
echo ""

# Test 4: Update review status (should fail for non-existent candidate)
echo "✍️  Test 4: Update review status"
echo "PUT /api/shortlist/:projectId/candidate/:candidateId/review"
curl -s -X PUT "${BASE_URL}/api/shortlist/00000000-0000-0000-0000-000000000000/candidate/00000000-0000-0000-0000-000000000001/review" \
  -H "Content-Type: application/json" \
  -d '{"status": "shortlisted", "reviewer_id": "test-reviewer"}' | jq '.'
echo ""
echo ""

# Test 5: Invalid review status (400 expected)
echo "❌ Test 5: Invalid review status (400 expected)"
curl -s -X PUT "${BASE_URL}/api/shortlist/00000000-0000-0000-0000-000000000000/candidate/00000000-0000-0000-0000-000000000001/review" \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}' | jq '.'
echo ""
echo ""

echo "=================================="
echo "✅ Tests Complete"
echo ""
echo "📖 To test with real data:"
echo "   1. Find a real project ID from Vetted database"
echo "   2. Find candidates who submitted auditions for that project"
echo "   3. Replace UUIDs in the commands above"
echo ""
echo "Example with real IDs:"
echo "   curl ${BASE_URL}/api/shortlist/YOUR_PROJECT_ID/stats"
