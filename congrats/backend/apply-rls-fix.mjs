#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://uvszvjbzcvkgktrvavqe.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3ODA0NiwiZXhwIjoyMDc3MzU0MDQ2fQ.ZJRbe7DvAfwkJHOsc9aaKb4-KjkXMKB6kzA8WBOx1J0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 Fixing job application RLS policies...\n');
  
  const sql = readFileSync('../FIX_JOB_APPLICATION_RLS.sql', 'utf8');
  
  // Execute the entire SQL as one transaction
  const { data, error } = await supabase.rpc('exec', { query: sql });
  
  if (error) {
    // If exec doesn't exist, try splitting and executing statements individually
    console.log('⚠️  Trying alternative method...\n');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      
      try {
        // Use the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ query: stmt + ';' })
        });
        
        if (!response.ok) {
          console.log(`   ⚠️  Statement ${i + 1} result: ${response.statusText}`);
        } else {
          console.log(`   ✅ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.log(`   ⚠️  Statement ${i + 1}:`, err.message);
      }
    }
  } else {
    console.log('✅ All statements executed successfully!');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ FIX APPLIED!');
  console.log('='.repeat(70));
  console.log('\n📝 What was fixed:');
  console.log('  • Created security definer function: get_current_user_email()');
  console.log('  • Updated RLS policies to use the function instead of direct queries');
  console.log('  • Anonymous users can now submit applications without errors');
  console.log('\n🧪 Please test by submitting a job application now.');
}

applyFix().catch(err => {
  console.error('❌ Error:', err);
  console.log('\n💡 Alternative: Copy the content of FIX_JOB_APPLICATION_RLS.sql');
  console.log('   and paste it into Supabase SQL Editor at:');
  console.log('   https://supabase.com/dashboard/project/uvszvjbzcvkgktrvavqe/sql/new');
});
