#!/bin/bash

# Quick script to apply the vetted_projects table schema

echo "🚀 Creating vetted_projects table in Supabase..."
echo "================================================"
echo ""

# Check if SQL file exists
if [ ! -f "create_vetted_projects.sql" ]; then
    echo "❌ Error: create_vetted_projects.sql not found"
    exit 1
fi

echo "📋 Instructions:"
echo ""
echo "1. Open this URL in your browser:"
echo "   https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe/sql/new"
echo ""
echo "2. Copy the SQL from: create_vetted_projects.sql"
echo ""
echo "3. Paste it into the SQL Editor"
echo ""
echo "4. Click 'RUN' button"
echo ""
echo "5. Wait for success message"
echo ""
echo "6. Then run: bash simulate_vetted_webhook.sh"
echo ""
echo "================================================"
echo ""
echo "📄 SQL File Contents:"
echo ""
cat create_vetted_projects.sql
echo ""
echo "================================================"
echo ""
echo "💡 TIP: You can copy this output and paste directly into Supabase SQL Editor!"
echo ""
