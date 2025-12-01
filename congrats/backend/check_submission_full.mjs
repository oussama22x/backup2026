import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubmission() {
  const { data: submission } = await supabase
    .from('audition_submissions')
    .select('*')
    .eq('id', 'f4ce8005-dc03-49ee-b8b2-299b773980db')
    .single();
  
  console.log('Full submission data:');
  console.log(JSON.stringify(submission, null, 2));
  
  // Try to get email from auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(submission.user_id);
  console.log('\nAuth user email:', authUser?.user?.email);
}

checkSubmission();
