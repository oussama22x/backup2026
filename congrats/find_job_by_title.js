
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
    console.log('Searching for "Interdimensional Reality Engineer"...');

    const { data, error } = await supabase
        .from('projects')
        .select('id, role_title, company_name')
        .ilike('role_title', '%Interdimensional%')
        .limit(5);

    if (error) {
        console.error('Error searching for job:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found jobs:');
        data.forEach(job => {
            console.log(`ID: ${job.id}`);
            console.log(`Title: ${job.role_title}`);
            console.log(`Company: ${job.company_name}`);

            // Generate slug
            const slug = (job.role_title || 'untitled')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') + '-' + job.id.substring(0, 8);

            console.log(`Slug: ${slug}`);
            console.log('-------------------');
        });
    } else {
        console.log('No jobs found matching the title.');
    }
}

findJob();
