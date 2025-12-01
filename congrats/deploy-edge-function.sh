#!/bin/bash

# Deployment Script for send-audition-to-vetted Edge Function
# This script guides you through the deployment process

set -e  # Exit on error

echo "🚀 Deployment Script for send-audition-to-vetted Edge Function"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Supabase CLI
echo "📋 Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 2: Check if logged in
echo "📋 Step 2: Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Running: supabase login"
    supabase login
fi
echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Step 3: Check project link
echo "📋 Step 3: Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked${NC}"
    echo ""
    echo "Please enter your Supabase Project Reference ID:"
    echo "(Find it in: Supabase Dashboard → Settings → General → Reference ID)"
    read -p "Project Ref: " PROJECT_REF
    
    echo "Linking to project: $PROJECT_REF"
    supabase link --project-ref "$PROJECT_REF"
fi
echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Step 4: Deploy Edge Function
echo "📋 Step 4: Deploying Edge Function..."
echo "Running: supabase functions deploy send-audition-to-vetted"
echo ""

supabase functions deploy send-audition-to-vetted

echo ""
echo -e "${GREEN}✅ Edge Function deployed successfully!${NC}"
echo ""

# Step 5: Get project details for next steps
echo "📋 Step 5: Next Steps"
echo "===================="
echo ""
echo "1. Run the database migration:"
echo "   - Go to Supabase Dashboard → SQL Editor"
echo "   - Copy contents of: backend/supabase/add-vetted-project-id.sql"
echo "   - Paste and run in SQL Editor"
echo ""
echo "2. Set vetted_project_id for your opportunities:"
echo "   UPDATE opportunities SET vetted_project_id = 'uuid-from-vetted-api' WHERE id = 'opportunity-id';"
echo ""
echo "3. Test the function:"
echo "   See DEPLOYMENT_GUIDE.md for testing instructions"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
