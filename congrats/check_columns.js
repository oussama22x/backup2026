
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('--- Columns in talent_profiles ---');
    // Note: accessing information_schema might not work with anon key, but let's try. 
    // If not, we can try to select * from talent_profiles limit 0 and check the error or returned object keys if any.

    // Alternative: Try to select specific columns and see if it errors
    const { data, error } = await supabase
        .from('talent_profiles')
        .select('city, country, salary_min, salary_max, experience_level, desired_salary_min, desired_salary_max')
        .limit(1);

    if (error) {
        console.error('Error fetching columns:', error.message);
    } else {
        console.log('Columns exist!');
    }
}

inspectColumns();
