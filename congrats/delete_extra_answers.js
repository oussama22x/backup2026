
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SUBMISSION_ID = 'ce9885cb-7693-4311-b5ad-3c833471fa48';

async function deleteExtraAnswers() {
    console.log(`🔍 Fetching submission: ${SUBMISSION_ID}...`);

    const { data: submission, error: subError } = await supabase
        .from("audition_submissions")
        .select("id, user_id, opportunity_id")
        .eq("id", SUBMISSION_ID)
        .single();

    if (subError || !submission) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    console.log(`✅ Found Submission.`);

    // Delete Q2 and Q3
    const idsToDelete = ['Q2', 'Q3'];

    console.log(`🗑️ Deleting answers: ${idsToDelete.join(', ')}...`);

    const { error: deleteError } = await supabase
        .from("audition_answers")
        .delete()
        .eq("user_id", submission.user_id)
        .eq("opportunity_id", submission.opportunity_id)
        .in("question_id", idsToDelete);

    if (deleteError) {
        console.error("❌ Error deleting answers:", deleteError);
    } else {
        console.log("✅ Successfully deleted extra answers.");
    }
}

deleteExtraAnswers();
