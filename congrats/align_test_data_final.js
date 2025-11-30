
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
const NEW_PROJECT_ID = '11bd4029-3508-4928-8825-38f3b3167ca9'; // Product Operations Lead
const NEW_QUESTION_ID = 'Q002_C2_prioritize';

async function alignData() {
    console.log(`🚀 Fetching submission ${SUBMISSION_ID}...`);
    const { data: submission, error: subError } = await supabase
        .from('audition_submissions')
        .select('user_id, opportunity_id')
        .eq('id', SUBMISSION_ID)
        .single();

    if (subError) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    console.log(`✅ Found submission. User: ${submission.user_id}, Opp: ${submission.opportunity_id}`);

    // 1. Update Opportunity with new Vetted Project ID
    console.log(`🔄 Updating Opportunity ${submission.opportunity_id} to Project ID ${NEW_PROJECT_ID}...`);
    const { error: oppError } = await supabase
        .from('opportunities')
        .update({ vetted_project_id: NEW_PROJECT_ID })
        .eq('id', submission.opportunity_id);

    if (oppError) {
        console.error("❌ Error updating opportunity:", oppError);
        return;
    }
    console.log("✅ Opportunity updated.");

    // 2. Update Answers to use valid Question ID
    console.log("📊 Fetching current answers...");
    const { data: answers, error: ansError } = await supabase
        .from('audition_answers')
        .select('*')
        .eq('user_id', submission.user_id)
        .eq('opportunity_id', submission.opportunity_id);

    if (ansError) {
        console.error("❌ Error fetching answers:", ansError);
        return;
    }

    console.log(`Found ${answers.length} answers.`);

    for (const ans of answers) {
        console.log(`🔄 Patching answer ${ans.id} -> New QID: ${NEW_QUESTION_ID}`);
        const { error: updateError } = await supabase
            .from('audition_answers')
            .update({ question_id: NEW_QUESTION_ID })
            .eq('id', ans.id);

        if (updateError) {
            console.error(`❌ Failed to update answer ${ans.id}:`, updateError);
        } else {
            console.log(`✅ Updated answer ${ans.id}`);
        }
    }
}

alignData();
