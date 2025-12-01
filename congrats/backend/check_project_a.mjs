import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Use MAIN_SUPABASE_URL (Project A)
const supabaseUrl = process.env.MAIN_SUPABASE_URL;
const supabaseKey = process.env.MAIN_SUPABASE_ANON_KEY; // Use ANON key as we might not have SERVICE_ROLE for it in .env?
// Wait, backend/.env has MAIN_SUPABASE_ANON_KEY. It doesn't have SERVICE_ROLE for MAIN.
// So I can only check public tables or use admin if I had the key.
// But I can try to login or just check app_user if it's public read.

console.log(`🔌 Connecting to Project A: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.argv[2];

async function checkProjectA() {
    console.log(`🔍 Checking Project A tables...\n`);

    // Check audition_submissions
    console.log('Checking for audition_submissions table...');
    const { data, error } = await supabase
        .from('audition_submissions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error (Table likely missing):', error.message);
    } else {
        console.log('✅ Table audition_submissions exists!');
    }
}

checkProjectA();
