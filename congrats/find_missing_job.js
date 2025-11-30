
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.VETTED_SUPABASE_URL;
const supabaseKey = process.env.VETTED_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Vetted Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findJob() {
    console.log('Searching for "AI Workflow Architect"...');

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('role_title', '%AI Workflow Architect%');

    if (error) {
        console.error('Error searching for job:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found jobs:');
        data.forEach(job => {
            console.log(`ID: ${job.id}`);
            console.log(`Title: ${job.role_title}`);
            console.log(`Status: ${job.status}`);
            console.log(`Created At: ${job.created_at}`);
            console.log('-------------------');
        });
    } else {
        console.log('No jobs found matching the title.');
    }
}

findJob();
