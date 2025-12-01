#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_B_URL;
const supabaseKey = process.env.SUPABASE_B_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSubmissions() {
  console.log('🔍 Analyzing Audition Submissions vs Auth Users\n');
  
  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUserIds = new Set(authData.users.map(u => u.id));
  const authUserMap = {};
  authData.users.forEach(u => {
    authUserMap[u.id] = { email: u.email, created_at: u.created_at };
  });
  
  console.log(`✅ Auth Users: ${authUserIds.size}`);
  
  // Get all submissions using Supabase client
  const { data: submissions, error } = await supabase
    .from('audition_submissions')
    .select('id, user_id, status, submitted_at')
    .limit(1000);
  
  if (error) {
    console.error('❌ Error fetching submissions:', error);
    return;
  }
  
  console.log(`📝 Total Submissions: ${submissions?.length || 0}\n`);
  
  // Analyze
  const validSubmissions = [];
  const invalidSubmissions = [];
  
  submissions.forEach(sub => {
    if (authUserIds.has(sub.user_id)) {
      validSubmissions.push(sub);
    } else {
      invalidSubmissions.push(sub);
    }
  });
  
  console.log(`✅ Submissions with valid auth users: ${validSubmissions.length}`);
  console.log(`❌ Submissions with invalid user_ids: ${invalidSubmissions.length}\n`);
  
  if (validSubmissions.length > 0) {
    console.log('📧 Valid Submissions (with emails):');
    validSubmissions.slice(0, 5).forEach(sub => {
      const auth = authUserMap[sub.user_id];
      console.log(`   - Submission ${sub.id.substring(0, 8)}...`);
      console.log(`     User: ${auth.email}`);
      console.log(`     Status: ${sub.status}\n`);
    });
  }
  
  if (invalidSubmissions.length > 0) {
    console.log('⚠️  Invalid Submissions (NO auth user):');
    invalidSubmissions.slice(0, 5).forEach(sub => {
      console.log(`   - Submission ${sub.id.substring(0, 8)}...`);
      console.log(`     Invalid User ID: ${sub.user_id}`);
      console.log(`     Status: ${sub.status}\n`);
    });
  }
  
  console.log('\n💡 RECOMMENDATION:');
  console.log('The audition system is creating submissions WITHOUT proper auth registration.');
  console.log('We should show submissions from valid auth users only, or fix the signup flow.');
}

analyzeSubmissions();
