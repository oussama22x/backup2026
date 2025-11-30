
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestSubmission() {
    const { data, error } = await supabase
        .from('audition_submissions')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching submission:', error);
        process.exit(1);
    }

    if (data) {
        console.log('Latest Submission Full Object:');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log('No submissions found.');
    }
}

checkLatestSubmission();
