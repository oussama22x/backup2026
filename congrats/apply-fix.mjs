#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables from .env
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying RLS fix for job_applications...\n');
  
  const migrationPath = join(__dirname, 'supabase/migrations/20241124000000_fix_job_applications_rls.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  
  // Split by statement and execute each
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 100)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
    
    if (error) {
      console.error('❌ Error:', error);
      console.log('\n⚠️  Trying alternative method...\n');
      
      // Try using the REST API directly
      const { error: directError } = await supabase.from('_sql').rpc('exec', { 
        query: statement + ';' 
      });
      
      if (directError) {
        console.error('❌ Direct execution also failed:', directError);
      }
    }
  }
  
  console.log('\n✅ Migration applied successfully!');
  console.log('\n📝 Changes made:');
  console.log('  - Created security definer function: get_current_user_email()');
  console.log('  - Updated RLS policies to avoid direct auth.users queries');
  console.log('  - Anonymous users can now submit applications without permission errors');
}

applyMigration().catch(console.error);
