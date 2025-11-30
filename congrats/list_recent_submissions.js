
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Congrats Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSubmissions() {
    console.log('Listing recent audition submissions...');

    const { data, error } = await supabase
        .from('audition_submissions')
        .select('id, user_id, opportunity_id, submitted_at, status')
        .order('submitted_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching submissions:', error);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(sub => {
            console.log(`Submission ID: ${sub.id}`);
            console.log(`User ID: ${sub.user_id}`);
            console.log(`Opportunity ID: ${sub.opportunity_id}`);
            console.log(`Status: ${sub.status}`);
            console.log(`Submitted At: ${sub.submitted_at}`);
            console.log('-------------------');
        });
    } else {
        console.log('No submissions found.');
    }
}

listSubmissions();
