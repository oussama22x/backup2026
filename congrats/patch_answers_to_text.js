
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
const QUESTION_TEXT = "Your team is deciding between Option A: containerization (Docker) and Option B: serverless functions (AWS Lambda) for a new data processing pipeline. What are the key trade-offs you would consider, and which would you recommend for a high-volume, unpredictable workload?";

async function patchAnswers() {
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

    console.log("📊 Fetching current answers...");
    const { data: answers, error: ansError } = await supabase
        .from('audition_answers')
        .select('*')
        .eq('user_id', submission.user_id)
        .eq('opportunity_id', submission.opportunity_id)
        .order('submitted_at', { ascending: true });

    if (ansError) {
        console.error("❌ Error fetching answers:", ansError);
        return;
    }

    console.log(`Found ${answers.length} answers.`);

    // Update the first answer to use the Question Text as ID
    if (answers.length > 0) {
        const ans = answers[0];
        console.log(`🔄 Patching answer ${ans.id} (Old QID: ${ans.question_id}) -> New QID: Question Text`);

        const { error: updateError } = await supabase
            .from('audition_answers')
            .update({ question_id: QUESTION_TEXT })
            .eq('id', ans.id);

        if (updateError) {
            console.error(`❌ Failed to update answer ${ans.id}:`, updateError);
        } else {
            console.log(`✅ Updated answer ${ans.id}`);
        }
    }
}

patchAnswers();
