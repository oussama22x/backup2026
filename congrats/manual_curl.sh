#!/bin/bash
SUPABASE_URL="https://uvszvjbzcvkgktrvavqe.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzgwNDYsImV4cCI6MjA3NzM1NDA0Nn0.Fbvd5EO5M0JxFY8VMwW2dTeiZYaOPTho8UPij4rFLzE"
SUBMISSION_ID="ce9885cb-7693-4311-b5ad-3c833471fa48"

curl -i -X POST "$SUPABASE_URL/functions/v1/fn_receive_audition_submission" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"submission_id\": \"$SUBMISSION_ID\"}"
