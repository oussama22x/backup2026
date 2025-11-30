
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

async function simulateSubmission() {
    // Use existing valid IDs
    const userId = "1f87251e-5666-4ec5-bb3c-93ca24bee162";
    const opportunityId = "550e8400-e29b-41d4-a716-446655440007";

    console.log("🚀 Simulating a NEW submission via Database Insert...");

    // Delete existing record to avoid unique constraint error
    const { error: deleteError } = await supabase
        .from('audition_submissions')
        .delete()
        .eq('user_id', userId)
        .eq('opportunity_id', opportunityId);

    if (deleteError) {
        console.log("⚠️ Could not delete existing record (might not exist):", deleteError.message);
    } else {
        console.log("🗑️ Deleted existing record (if any).");
    }

    const { data, error } = await supabase
        .from('audition_submissions')
        .insert([
            {
                user_id: userId,
                opportunity_id: opportunityId,
                status: 'started',
                questions: [], // Empty for test
                audio_urls: [],
                // created_at: new Date().toISOString(), // Removed as column might not exist or be auto-generated
                // submitted_at: new Date().toISOString() // Optional, depending on trigger logic
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('❌ Insert Failed:', error);
    } else {
        console.log('✅ Insert Successful!');
        console.log(`New Submission ID: ${data.id}`);
        console.log('👉 This should have triggered the Webhook automatically.');
    }
}

simulateSubmission();
