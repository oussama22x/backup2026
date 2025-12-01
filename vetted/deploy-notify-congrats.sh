#!/bin/bash

# Deploy the Vetted → Congrats notification function

echo "🚀 Deploying notify-congrats-new-project to Vetted..."
echo "===================================================="
echo ""

# Check if we're in the vetted directory
if [ ! -d "supabase/functions/notify-congrats-new-project" ]; then
    echo "❌ Error: Must run from vetted project root directory"
    exit 1
fi

# Deploy the function
echo "📦 Deploying function..."
supabase functions deploy notify-congrats-new-project --no-verify-jwt

echo ""
echo "✅ Function deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vetted Supabase Dashboard"
echo "2. Database → Webhooks → Create webhook"
echo "3. Configure:"
echo "   Table: projects"
echo "   Events: INSERT"
echo "   URL: https://[YOUR-VETTED-PROJECT-REF].supabase.co/functions/v1/notify-congrats-new-project"
echo "   Method: POST"
echo ""
echo "🧪 Test by creating a new project in Vetted!"
echo ""
