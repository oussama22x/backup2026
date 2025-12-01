
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

async function checkTriggers() {
    console.log("🔍 Checking for triggers on 'audition_submissions'...");

    // Query postgres information_schema (requires generic SQL query support or rpc)
    // Since we don't have direct SQL access via client easily without rpc, 
    // we will try to infer it or use a known rpc if available.
    // Actually, we can't query information_schema directly via supabase-js client unless we have a helper function exposed.

    // Alternative: We can try to CREATE the trigger and see if it says "already exists".
    // But we don't have the SQL to create it right now (it's usually done via Dashboard).

    // Let's try to use the 'rpc' if there is one, or just assume we need to guide the user.
    // Wait, I can use the CLI to run SQL!

    console.log("⚠️ Cannot check triggers via JS client directly without custom RPC.");
    console.log("👉 Please run the following command in your terminal:");
    console.log(`supabase db query --project-ref uvszvjbzcvkgktrvavqe "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'audition_submissions';"`);
}

checkTriggers();
