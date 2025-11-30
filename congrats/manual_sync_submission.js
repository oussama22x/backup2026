
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vettedProjectId = '674acde9-6f6f-4a4f-b709-b4737ece702d';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Congrats Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSubmission() {
    console.log(`Searching for opportunity linked to Vetted Project: ${vettedProjectId}`);

    // 1. Find Opportunity
    // Try matching ID first (since JobDetail sets ID = Vetted Project ID)
    let opportunityId = null;

    const { data: oppById, error: idError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', vettedProjectId);

    console.log('Search by ID result count:', oppById?.length);
    console.log('Search by ID error:', idError);

    if (oppById && oppById.length > 0) {
        console.log(`Found opportunity by ID: ${oppById[0].id}`);
        opportunityId = oppById[0].id;
    } else {
        // Fallback: Check vetted_project_id
        const { data: oppsByVettedId } = await supabase
            .from('opportunities')
            .select('id, title')
            .eq('vetted_project_id', vettedProjectId);

        if (oppsByVettedId && oppsByVettedId.length > 0) {
            console.log(`Found opportunity by vetted_project_id: ${oppsByVettedId[0].id}`);
            opportunityId = oppsByVettedId[0].id;
        }
    }

    if (!opportunityId) {
        console.log('❌ No opportunity found for this Vetted Project ID.');
        return;
    }

    await processOpportunity(opportunityId);
}

async function processOpportunity(opportunityId) {
    // 2. Find Submissions
    console.log(`Fetching submissions for opportunity: ${opportunityId}`);
    const { data: submissions, error: subError } = await supabase
        .from('audition_submissions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('submitted_at', { ascending: false });

    if (subError) {
        console.error('Error fetching submissions:', subError);
        return;
    }

    if (!submissions || submissions.length === 0) {
        console.log('❌ No submissions found for this opportunity.');
        return;
    }

    console.log(`Found ${submissions.length} submissions.`);
    const submission = submissions[0]; // Process the most recent one
    console.log(`Processing submission: ${submission.id} (User: ${submission.user_id})`);

    // 3. Trigger Edge Function
    const edgeFunctionUrl = 'https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_audition_submission';
    const anonKey = process.env.SUPABASE_ANON_KEY;

    console.log('🚀 Triggering Edge Function manually...');
    try {
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({ submission_id: submission.id })
        });

        const result = await response.text();
        console.log(`Response Status: ${response.status}`);
        console.log('Response Body:', result);

        if (response.ok) {
            console.log('✅ Successfully triggered sync to VettedAI!');
        } else {
            console.error('❌ Failed to trigger sync.');
        }
    } catch (err) {
        console.error('❌ Error calling Edge Function:', err);
    }
}

syncSubmission();
