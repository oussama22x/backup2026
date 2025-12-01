#!/bin/bash

# Deployment Script for fn_receive_new_project Edge Function
# This script deploys the function that handles new project creation from VettedAI

set -e  # Exit on error

echo "🚀 Deploying fn_receive_new_project..."
echo "====================================="
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it."
    exit 1
fi

# Deploy
echo "Running: supabase functions deploy fn_receive_new_project"
supabase functions deploy fn_receive_new_project --no-verify-jwt

echo ""
echo "✅ Function deployed!"
echo "You can now run ./simulate_vetted_webhook.sh to test it."
