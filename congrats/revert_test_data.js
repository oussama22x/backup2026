
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to load env vars
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.join(__dirname, 'backend/.env');
const localEnvPath = path.join(__dirname, '.env');

let env = {};
if (fs.existsSync(backendEnvPath)) Object.assign(env, loadEnv(backendEnvPath));
if (fs.existsSync(localEnvPath)) Object.assign(env, loadEnv(localEnvPath));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SUBMISSION_ID = 'ce9885cb-7693-4311-b5ad-3c833471fa48';
const BROKEN_PROJECT_ID = '674acde9-6f6f-4a4f-b709-b4737ece702d'; // AI Workflow Architect (No IDs)

async function revertData() {
    console.log(`🔄 Reverting Opportunity to BROKEN Project ID ${BROKEN_PROJECT_ID}...`);

    // 1. Get Opportunity ID
    const { data: submission } = await supabase
        .from('audition_submissions')
        .select('opportunity_id')
        .eq('id', SUBMISSION_ID)
        .single();

    const { error: oppError } = await supabase
        .from('opportunities')
        .update({ vetted_project_id: BROKEN_PROJECT_ID })
        .eq('id', submission.opportunity_id);

    if (oppError) {
        console.error("❌ Error updating opportunity:", oppError);
        return;
    }
    console.log("✅ Opportunity reverted to broken project.");

    // 2. Reset answers to have NO question_id (to simulate fresh submission)
    // Actually, we can just leave them or set them to "unknown" to test the mapping logic if we implemented it.
    // But since our current logic passes question_id as-is, and the scaffold will be repaired with NEW IDs,
    // the submission might still fail validation if VettedAI checks for EXACT match of the NEW IDs.
    // However, the goal is to see if the REPAIR logic runs.
    // Let's set the answer question_id to something dummy.

    const { error: ansError } = await supabase
        .from('audition_answers')
        .update({ question_id: 'dummy_id_to_force_repair' })
        .eq('opportunity_id', submission.opportunity_id);

    if (ansError) console.error("❌ Error resetting answers:", ansError);
    else console.log("✅ Answers reset.");
}

revertData();
