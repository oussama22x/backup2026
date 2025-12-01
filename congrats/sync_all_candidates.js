
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to load env vars
function loadEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
    return env;
}

const env = loadEnv(path.join(process.cwd(), 'backend/.env'));
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// The Opportunity ID we are working with
const OPPORTUNITY_ID = "0223bd91-ed53-482a-beb6-8a86e2527e23";

async function syncAll() {
    console.log(`🚀 Starting Batch Sync for Opportunity: ${OPPORTUNITY_ID}`);

    // 1. Fetch all submissions for this opportunity
    const { data: submissions, error } = await supabase
        .from('audition_submissions')
        .select('id, user_id, submitted_at')
        .eq('opportunity_id', OPPORTUNITY_ID)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching submissions:", error);
        return;
    }

    console.log(`📊 Found ${submissions.length} candidates.`);

    // 2. Loop and Trigger Edge Function for each
    for (const [index, sub] of submissions.entries()) {
        console.log(`\n[${index + 1}/${submissions.length}] Syncing Submission: ${sub.id} (User: ${sub.user_id})...`);

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-audition-to-vetted`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ submission_id: sub.id })
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`   ✅ Success! VettedAI Response: ${result.message || 'OK'}`);
            } else {
                console.error(`   ❌ Failed: ${result.error || JSON.stringify(result)}`);
            }
        } catch (err) {
            console.error(`   ❌ Network Error: ${err.message}`);
        }

        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✨ Batch Sync Complete!`);
}

syncAll();
