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
OPP_ID="98420d72-251d-4b92-9539-6fd0657c695a"

echo "🚀 Re-Patching answers for User $USER_ID and Opportunity $OPP_ID..."

# Helper function to patch answer
patch_answer() {
    local old_qid=$1
    local new_qid=$2
    
    echo "🔄 Updating $old_qid -> $new_qid..."
    
    # We need to find the answer that currently has the 'old_qid' (which might be the WRONG ID I set earlier)
    # Actually, I set them to Q004_E2_define_done etc.
    # So I need to map FROM the ones I just set TO the correct ones.
    # OR, I can just update by index/creation time if I could, but I can't easily via REST.
    
    # simpler approach: The user's original submission had q1, q2...
    # I changed q1 -> Q004_E2_define_done.
    # Now I need to change Q004_E2_define_done -> Q003_C3_tradeoff.
    
    curl -s -X PATCH "$SUPABASE_URL/rest/v1/audition_answers?user_id=eq.$USER_ID&opportunity_id=eq.$OPP_ID&question_id=eq.$old_qid" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"question_id\": \"$new_qid\"}"
        
    echo " Done."
}

# Mapping: Old Wrong ID (from previous patch) -> New Correct ID (from scaffold)
patch_answer "Q004_E2_define_done" "Q003_C3_tradeoff"
patch_answer "Q005_E3_anticipate_risk" "Q001_C1_diagnose"
patch_answer "Q003_E1_plan_sequence" "Q002_C2_prioritize"
patch_answer "Q010_A2_clarify_ask" "Q007_CC2_report_up"
patch_answer "Q013_EI2_respectful_pushback" "Q014_J4_conflict_of_interest"
patch_answer "Q006_CC1_translate_for_audience" "Q004_E1_plan_sequence"
patch_answer "Q008_CC3_resolve_disagreement" "Q009_A1_curveball_reaction"
patch_answer "Q012_EI1_deescalate" "Q006_CC1_translate_for_audience"
patch_answer "Q007_CC2_report_up" "Q012_J2_risk_disclosure"
patch_answer "Q014_EI3_handle_feedback" "Q013_J3_data_privacy_call"

echo "✅ All answers re-patched with CORRECT IDs."
