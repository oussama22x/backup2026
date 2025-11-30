
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Congrats Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listOpportunities() {
    console.log('Checking for specific opportunity...');
    const targetId = '674acde9-6f6f-4a4f-b709-b4737ece702d';

    const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', targetId);

    if (error) {
        console.error('Error fetching opportunity:', error);
    } else if (data && data.length > 0) {
        console.log('Found opportunity:', data[0]);
    } else {
        console.log('Opportunity NOT found.');
    }

    console.log('Checking for submissions with this opportunity_id...');
    const { data: subs, error: subError } = await supabase
        .from('audition_submissions')
        .select('*')
        .eq('opportunity_id', targetId);

    if (subError) {
        console.error('Error fetching submissions:', subError);
    } else if (subs && subs.length > 0) {
        console.log(`Found ${subs.length} submissions.`);
        const submission = subs[0];
        console.log('Processing submission:', submission.id);

        // 1. Update status to pending_review
        console.log('Updating status to pending_review...');
        const { error: updateError } = await supabase
            .from('audition_submissions')
            .update({ status: 'pending_review' })
            .eq('id', submission.id);

        if (updateError) {
            console.error('Error updating status:', updateError);
            return;
        }
        console.log('Status updated.');

        // 2. Trigger Edge Function
        const edgeFunctionUrl = 'https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_audition_submission';
        const anonKey = process.env.SUPABASE_ANON_KEY; // Need to add this to env loading if not present, but using service role key for auth header is also fine if function allows it, or use anon key.
        // Wait, process.env.SUPABASE_ANON_KEY might not be loaded if I didn't verify .env has it.
        // backend/.env has SUPABASE_ANON_KEY.

        console.log('🚀 Triggering Edge Function manually...');
        try {
            const response = await fetch(edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
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

    } else {
        console.log('No submissions found for this opportunity ID.');
    }
}

listOpportunities();
