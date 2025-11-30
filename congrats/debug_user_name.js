
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUser() {
    const submissionId = '72c7a700-e453-46b2-8dfa-85ad01dfc1cc'; // The one we found
    console.log(`Debugging user for submission: ${submissionId}`);

    // 1. Get User ID
    const { data: sub } = await supabase.from('audition_submissions').select('user_id').eq('id', submissionId).single();
    if (!sub) { console.log('Submission not found'); return; }
    const userId = sub.user_id;
    console.log(`User ID: ${userId}`);

    // 2. Check Auth User
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
    console.log('Auth User Metadata:', user?.user_metadata);

    // 3. Check Talent Profile
    const { data: profile } = await supabase.from('talent_profiles').select('*').eq('user_id', userId).maybeSingle();
    console.log('Talent Profile:', profile);

    // 4. Check Job Applications (often has name from form)
    const { data: apps } = await supabase.from('job_applications').select('candidate_data').eq('user_id', userId).limit(1);
    if (apps && apps.length > 0) {
        console.log('Job Application Data:', apps[0].candidate_data);
    }
}

debugUser();
