#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_B_URL;
const supabaseKey = process.env.SUPABASE_B_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
  console.log('🔍 Checking Auth Users in Congrats Database\n');
  
  // Try to list all users using admin API
  try {
    console.log('Attempting to list all auth users...');
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return;
    }
    
    console.log(`✅ Found ${data.users.length} users in auth.users:`);
    data.users.forEach((user, i) => {
      console.log(`\n${i + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
    });
    
    // Check for specific user
    const targetUserId = 'a86debc8-0ef0-4466-bb27-f7b36596d881';
    console.log(`\n\n🎯 Checking for specific user: ${targetUserId}`);
    
    const targetUser = data.users.find(u => u.id === targetUserId);
    if (targetUser) {
      console.log('✅ User FOUND in auth.users!');
      console.log('   Email:', targetUser.email);
    } else {
      console.log('❌ User NOT FOUND in auth.users');
      console.log('   This user_id exists in audition_submissions but NOT in auth system');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkAuthUsers();
