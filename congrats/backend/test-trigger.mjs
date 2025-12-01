#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTrigger() {
  console.log('🔍 Testing database trigger...\n');
  
  const testEmail = `trigger_test_${Date.now()}@example.com`;
  
  console.log('1. Creating test user:', testEmail);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPass123!',
    email_confirm: true
  });
  
  if (authError) {
    console.error('❌ Failed:', authError.message);
    process.exit(1);
  }
  
  console.log('✅ Auth user created:', authData.user.id);
  
  // Wait for trigger to execute
  console.log('\n2. Waiting for trigger to execute...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n3. Checking if app_user was created...');
  const { data: appUserData, error: appUserError } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  
  if (appUserData) {
    console.log('\n✅ ✅ ✅ TRIGGER WORKS! ✅ ✅ ✅');
    console.log('app_user was created automatically by the trigger!');
    console.log('   Email:', appUserData.email);
    console.log('   Role:', appUserData.role);
    console.log('   Created:', appUserData.created_at);
  } else {
    console.log('\n❌ ❌ ❌ TRIGGER NOT WORKING! ❌ ❌ ❌');
    console.log('app_user was NOT created');
    console.log('Error:', appUserError?.message);
    console.log('\n🔧 The trigger may not exist in this database.');
    console.log('Run migrations to create it.');
  }
  
  // Cleanup
  console.log('\n4. Cleaning up test user...');
  await supabase.auth.admin.deleteUser(authData.user.id);
  console.log('✅ Test complete');
  
  process.exit(0);
}

testTrigger();
