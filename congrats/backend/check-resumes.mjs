#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResumes() {
  console.log('🔍 Checking resumes in storage bucket...\n');
  
  // Get recent users
  const { data: users } = await supabase
    .from('app_user')
    .select('id, email')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!users) {
    console.log('No users found');
    process.exit(0);
  }
  
  console.log('Checking resume storage for recent users:\n');
  
  for (const user of users) {
    console.log(`📧 ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    
    const { data: files, error } = await supabase.storage
      .from('resumes')
      .list(user.id);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (files && files.length > 0) {
      console.log(`   ✅ Has ${files.length} file(s):`);
      files.forEach(f => console.log(`      - ${f.name}`));
    } else {
      console.log(`   ⚠️  No resume found in storage`);
    }
    console.log('');
  }
  
  process.exit(0);
}

checkResumes();
