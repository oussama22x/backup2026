import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the same directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument.');
  console.error('Usage: node check_full_flow.mjs <email>');
  process.exit(1);
}

async function checkFullFlow() {
  console.log(`🔍 Checking database records for: ${email}\n`);

  // 1. Check Auth User (app_user)
  console.log('1️⃣  Checking app_user...');
  // 1. Check Auth User (app_user)
  console.log('1️⃣  Checking app_user...');
  const { data: users, error: userError } = await supabase
    .from('app_user')
    .select('*')
    .eq('email', email);

  if (userError) {
    console.error('❌ Error checking app_user:', userError.message);
    return;
  }

  let userId = null;

  if (users && users.length > 0) {
    console.log(`✅ Found ${users.length} user(s) in app_user:`);
    users.forEach(u => console.log(`   - ID: ${u.id} | Role: ${u.role}`));
    userId = users[0].id;
  } else {
    console.error('❌ User not found in app_user table.');

    // Try to find in auth.users
    console.log('🔎 Checking auth.users...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error listing auth users:', authError.message);
      return;
    }

    const authUser = authUsers.find(u => u.email === email);
    if (authUser) {
      console.log(`✅ Found user in auth.users: ${authUser.id}`);
      console.log(`   Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
      userId = authUser.id;
    } else {
      console.error('❌ User not found in auth.users either.');
      return;
    }
  }

  if (!userId) return;

  const user = { id: userId }; // Mock user object for subsequent checks

  // 2. Check Profile (talent_profiles)
  console.log('\n2️⃣  Checking talent_profiles...');
  const { data: profile, error: profileError } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Error checking profile:', profileError.message);
  } else if (!profile) {
    console.warn('⚠️  No profile found for this user.');
  } else {
    console.log(`✅ Found profile: ${profile.full_name}`);
    console.log(`   Resume URL: ${profile.resume_url ? '✅ Present' : '❌ Missing'}`);
  }

  // 3. Check Job Applications (job_applications)
  console.log('\n3️⃣  Checking job_applications...');
  const { data: applications, error: appError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id);

  if (appError) {
    console.error('❌ Error checking applications:', appError.message);
  } else if (!applications || applications.length === 0) {
    console.warn('⚠️  No job applications found.');
  } else {
    console.log(`✅ Found ${applications.length} application(s):`);
    applications.forEach(app => {
      console.log(`   - Job ID: ${app.job_id} | Status: ${app.status} | Audition ID: ${app.audition_submission_id || 'None'}`);
    });
  }

  // 4. Check Audition Submissions (audition_submissions)
  console.log('\n4️⃣  Checking audition_submissions...');
  const { data: submissions, error: subError } = await supabase
    .from('audition_submissions')
    .select('*')
    .eq('user_id', user.id);

  if (subError) {
    console.error('❌ Error checking submissions:', subError.message);
  } else if (!submissions || submissions.length === 0) {
    console.warn('⚠️  No audition submissions found.');
  } else {
    console.log(`✅ Found ${submissions.length} submission(s):`);
    submissions.forEach(sub => {
      console.log(`   - ID: ${sub.id} | Job ID: ${sub.opportunity_id} | Status: ${sub.status}`);
      console.log(`     Questions: ${sub.questions ? sub.questions.length : 0}`);
    });
  }

  console.log('\n🏁 Check complete.');
}

checkFullFlow();
