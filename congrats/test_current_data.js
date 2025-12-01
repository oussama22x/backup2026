import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uvszvjbzcvkgktrvavqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3ODA0NiwiZXhwIjoyMDc3MzU0MDQ2fQ.ZJRbe7DvAfwkJHOsc9aaKb4-KjkXMKB6kzA8WBOx1J0'
);

async function testCurrentData() {
  console.log('\n📊 Testing Current Data Being Sent to Recruiters\n');

  // Find a user with submission
  const { data: submissions } = await supabase
    .from('audition_submissions')
    .select('user_id, id, opportunity_id')
    .limit(1);

  if (!submissions || submissions.length === 0) {
    console.log('❌ No submissions found');
    return;
  }

  const testUser = submissions[0];
  console.log(`🧑 Test User: ${testUser.user_id}`);
  console.log(`📝 Submission ID: ${testUser.id}\n`);

  // Get profile
  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('user_id', testUser.user_id)
    .single();

  // Get auth user
  const { data: { user } } = await supabase.auth.admin.getUserById(testUser.user_id);

  console.log('📋 Data Currently Available:\n');
  
  const data = {
    '✅ Name': `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '❌ Missing',
    '✅ Email': user?.email || profile?.email || '❌ Missing',
    '❌ Resume': 'Column not added yet',
    '✅ LinkedIn': profile?.linkedin_url || '❌ Not set',
    '✅ GitHub': profile?.github_url || '❌ Not set',
    '✅ Portfolio': profile?.portfolio_url || '❌ Not set',
    '✅ Bio': profile?.bio || '❌ Not set',
    '✅ Experience': profile?.years_of_experience || '❌ Not set',
    '✅ Salary Min': profile?.desired_salary_min || '❌ Not set',
    '✅ Salary Max': profile?.desired_salary_max || '❌ Not set',
    '✅ Availability': profile?.availability_date || '❌ Not set',
    '✅ Desired Role': profile?.desired_role || '❌ Not set',
    '✅ Location': profile?.location || '❌ Not set',
  };

  Object.entries(data).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n🔍 What Recruiters Would See:\n');
  
  const mockPayload = {
    submission_id: testUser.id,
    project_id: testUser.opportunity_id,
    email: user?.email || profile?.email || '',
    name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
    resume_url: null, // ← Would be here once column added
    profile: {
      experience_level: profile?.years_of_experience || null,
      desired_salary_min: profile?.desired_salary_min || null,
      desired_salary_max: profile?.desired_salary_max || null,
      availability_date: profile?.availability_date || null,
      current_city: profile?.location || null,
      desired_roles: profile?.desired_role ? [profile.desired_role] : [],
      linkedin_url: profile?.linkedin_url || null,
      github_url: profile?.github_url || null,
      portfolio_url: profile?.portfolio_url || null,
      bio: profile?.bio || null,
    }
  };

  console.log(JSON.stringify(mockPayload, null, 2));

  console.log('\n📈 Coverage:');
  const fieldsSet = Object.values(data).filter(v => v && !v.includes('❌')).length;
  const totalFields = Object.keys(data).length;
  console.log(`   ${fieldsSet}/${totalFields} fields have data`);
  console.log(`   Resume will be ${totalFields + 1}/${totalFields + 1} once column added\n`);
}

testCurrentData();
