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
USER_ID="eac0205f-e959-49a2-8509-b09b928cb0fa"
OPP_ID="bd37cd69-6d0d-4794-95cc-0fc001c4a96d"

echo "🚀 Patching answers for User $USER_ID and Opportunity $OPP_ID..."

# Helper function to patch answer
patch_answer() {
    local old_qid=$1
    local new_qid=$2
    
    echo "🔄 Updating $old_qid -> $new_qid..."
    
    curl -s -X PATCH "$SUPABASE_URL/rest/v1/audition_answers?user_id=eq.$USER_ID&opportunity_id=eq.$OPP_ID&question_id=eq.$old_qid" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"question_id\": \"$new_qid\"}"
        
    echo " Done."
}

patch_answer "q1" "Q004_E2_define_done"
patch_answer "q2" "Q005_E3_anticipate_risk"
patch_answer "q3" "Q003_E1_plan_sequence"
patch_answer "q4" "Q010_A2_clarify_ask"
patch_answer "q5" "Q013_EI2_respectful_pushback"
patch_answer "q6" "Q006_CC1_translate_for_audience"
patch_answer "q7" "Q008_CC3_resolve_disagreement"
patch_answer "q8" "Q012_EI1_deescalate"
patch_answer "q9" "Q007_CC2_report_up"
patch_answer "q10" "Q014_EI3_handle_feedback"

echo "✅ All answers patched."
