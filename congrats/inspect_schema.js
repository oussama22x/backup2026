
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key, hope it has read access

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Questions Table ---');
    const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .limit(1);

    if (qError) console.error('Error fetching questions:', qError);
    else console.log(questions);

    console.log('\n--- Audition Answers Table ---');
    const { data: answers, error: aError } = await supabase
        .from('audition_answers')
        .select('*')
        .limit(1);

    if (aError) console.error('Error fetching answers:', aError);
    else console.log(answers);

    console.log('\n--- Opportunities Table ---');
    const { data: opps, error: oError } = await supabase
        .from('opportunities')
        .select('*')
        .limit(1);

    if (oError) console.error('Error fetching opportunities:', oError);
    else console.log(opps);
}

inspect();
