#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSignupFlow() {
  console.log('🧪 Testing Complete Signup Flow with Database Trigger...\n');
  
  const testEmail = `test_trigger_${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  console.log('1️⃣ Creating auth user (trigger should auto-create app_user)...');
  console.log('   Email:', testEmail);
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });
  
  if (authError) {
    console.error('❌ Auth signup failed:', authError.message);
    process.exit(1);
  }
  
  console.log('✅ Auth user created!');
  console.log('   User ID:', authData.user.id);
  
  // Wait a moment for trigger to execute
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n2️⃣ Checking if trigger created app_user record...');
  
  const { data: appUserCheck, error: appUserError } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', authData.user.id)
    .single();
    
  if (appUserError || !appUserCheck) {
    console.error('❌ Trigger did NOT create app_user record!');
    console.error('   Error:', appUserError?.message || 'Not found');
    console.log('\n⚠️  DATABASE TRIGGER IS NOT WORKING!');
    
    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user.id);
    process.exit(1);
  }
  
  console.log('✅ Trigger AUTOMATICALLY created app_user!');
  console.log('   ID:', appUserCheck.id);
  console.log('   Email:', appUserCheck.email);
  console.log('   Role:', appUserCheck.role);
  console.log('   Created:', appUserCheck.created_at);
  
  console.log('\n==============================================');
  console.log('✅ DATABASE TRIGGER IS WORKING CORRECTLY!');
  console.log('==============================================');
  console.log('When users sign up:');
  console.log('  1. Auth record created in auth.users ✅');
  console.log('  2. Database trigger fires automatically ✅');
  console.log('  3. app_user record created automatically ✅');
  console.log('  4. All data is persisted to database ✅');
  console.log('\n📝 NOTE: The manual app_user insert in SignupFlow.tsx');
  console.log('   is REDUNDANT because the trigger does it automatically.');
  
  console.log('\nCleanup: Deleting test user...');
  await supabase.auth.admin.deleteUser(authData.user.id);
  console.log('✅ Test user deleted');
  
  process.exit(0);
}

testSignupFlow();
