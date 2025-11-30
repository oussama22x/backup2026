#!/bin/bash

# Load environment variables from backend/.env
ENV_FILE="backend/.env"

if [ -f "$ENV_FILE" ]; then
    SUPABASE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY "$ENV_FILE" | cut -d '=' -f2)
else
    echo "❌ $ENV_FILE not found."
    exit 1
fi

SUPABASE_URL="https://uvszvjbzcvkgktrvavqe.supabase.co"
ANSWER_ID="72829f13-f462-4c9d-886c-58d5d8d56138"
CORRECT_QID="Q007_CC2_report_up"

echo "🚀 Fixing collision for Answer ID $ANSWER_ID..."
echo "🔄 Updating to $CORRECT_QID..."

curl -s -X PATCH "$SUPABASE_URL/rest/v1/audition_answers?id=eq.$ANSWER_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"question_id\": \"$CORRECT_QID\"}"
    
echo " Done."
