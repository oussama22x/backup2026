
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

async function verifyRow() {
    const id = "f2694b83-e808-4f72-9498-69fc7126c091";
    console.log(`Checking for submission ID: ${id}`);

    const { data, error } = await supabase
        .from('audition_submissions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('❌ Row not found or error:', error.message);
    } else {
        console.log('✅ Row exists in database!');
        console.log('Created At:', data.created_at);
    }
}

verifyRow();
