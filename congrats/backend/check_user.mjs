import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  // Get the submission
  const { data: submission } = await supabase
    .from('audition_submissions')
    .select('*')
    .eq('id', 'f4ce8005-dc03-49ee-b8b2-299b773980db')
    .single();
  
  console.log('Submission user_id:', submission.user_id);
  
  // Get the user
  const { data: user } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', submission.user_id)
    .single();
  
  console.log('User data:', user);
  
  // Get profile
  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('user_id', submission.user_id)
    .single();
  
  console.log('Profile data:', profile);
}

checkUser();
