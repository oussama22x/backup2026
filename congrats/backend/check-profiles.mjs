#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  console.log('🔍 Checking talent_profiles data...\n');
  
  const { data: profiles, error } = await supabase
    .from('talent_profiles')
    .select('user_id, first_name, last_name, onboarding_completed, is_profile_complete, wizard_step')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('❌ NO TALENT_PROFILES FOUND!');
    console.log('\n🔧 This is the problem:');
    console.log('   Users are signing up and app_user records are created,');
    console.log('   but NO talent_profile records are being created!');
    console.log('\n   Without a talent_profile, RoleGuard thinks the profile is incomplete');
    console.log('   and redirects back to the wizard.\n');
  } else {
    console.log('✅ Recent talent_profiles:');
    profiles.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.first_name || 'No name'} ${p.last_name || ''}`);
      console.log(`   User ID: ${p.user_id}`);
      console.log(`   Onboarding Complete: ${p.onboarding_completed ? '✅ YES' : '❌ NO'}`);
      console.log(`   Profile Complete: ${p.is_profile_complete ? '✅ YES' : '❌ NO'}`);
      console.log(`   Wizard Step: ${p.wizard_step || 'Not set'}`);
    });
  }
  
  process.exit(0);
}

checkProfiles();
