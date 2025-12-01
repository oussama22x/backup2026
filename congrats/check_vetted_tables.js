
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const vettedUrl = process.env.VETTED_SUPABASE_URL;
const vettedKey = process.env.VETTED_SUPABASE_KEY;
const supabaseVetted = createClient(vettedUrl, vettedKey);

async function listTables() {
    console.log('Checking Vetted DB tables...');

    const tablesToCheck = ['answers', 'candidate_answers', 'submission_answers', 'applications', 'submissions'];

    for (const table of tablesToCheck) {
        const { data, error } = await supabaseVetted.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table '${table}': Not found or error (${error.message})`);
        } else {
            console.log(`Table '${table}': Exists! Sample:`, data);
        }
    }
}

listTables();
