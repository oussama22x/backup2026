#!/bin/bash

# Backfill VettedAI Submissions Script
# This script runs the Deno backfill script with the correct environment variables

echo "🚀 Starting VettedAI Backfill Process..."
echo ""

# Load environment variables from backend/.env
if [ -f "./backend/.env" ]; then
    echo "📂 Loading environment variables from backend/.env..."
    export $(grep -v '^#' ./backend/.env | xargs)
else
    echo "⚠️  Warning: backend/.env not found"
    echo "   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
fi

# Check if required env vars are set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL is not set"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Run the Node.js script
echo "🏃 Executing backfill script..."
echo ""

node ./backfill-vetted-submissions.mjs

echo ""
echo "✨ Backfill process complete!"
