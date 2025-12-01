#!/bin/bash

VETTED_URL="https://lagvszfwsruniuinxdjb.supabase.co/rest/v1/projects?role_title=ilike.*Machine*&select=*"
VETTED_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjA0ODMsImV4cCI6MjA3ODQzNjQ4M30.kj21M-IqAu7utGr4EVDdhKB6-5Zf5UpAI0yo41Wjljw"

echo "🚀 Searching for 'Machine' projects in VettedAI..."

curl -X GET "$VETTED_URL" \
  -H "apikey: $VETTED_KEY" \
  -H "Authorization: Bearer $VETTED_KEY" \
  -v
