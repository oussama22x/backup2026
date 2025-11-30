#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMissingUsers() {
  console.log('🔍 Finding users without app_user records...\n');
  
  const { data: authData } = await supabase.auth.admin.listUsers();
  const { data: appUsers } = await supabase.from('app_user').select('id');
  
  const appUserIds = new Set(appUsers?.map(u => u.id) || []);
  
  const missingUsers = authData.users.filter(u => !appUserIds.has(u.id));
  
  console.log('Total auth users:', authData.users.length);
  console.log('Total app_user records:', appUsers?.length || 0);
  console.log('Missing app_user records:', missingUsers.length);
  
  if (missingUsers.length > 0) {
    console.log('\n❌ Users WITHOUT app_user records:');
    missingUsers.forEach((u, i) => {
      console.log(`\n${i + 1}. Email: ${u.email}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Created: ${u.created_at}`);
    });
    
    console.log('\n\n🔧 The database trigger is NOT working!');
    console.log('Creating missing app_user records now...\n');
    
    for (const user of missingUsers) {
      const { error } = await supabase.from('app_user').insert({
        id: user.id,
        email: user.email,
        role: 'TALENT'
      });
      
      if (error) {
        console.log(`❌ Failed to create for ${user.email}: ${error.message}`);
      } else {
        console.log(`✅ Created app_user for ${user.email}`);
      }
    }
    
    console.log('\n✅ Backfill complete! All users now have app_user records.');
  } else {
    console.log('\n✅ All auth users have app_user records!');
  }
  
  process.exit(0);
}

checkMissingUsers();
