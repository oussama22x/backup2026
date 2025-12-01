
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

const USER_ID = '20e327f2-996b-4b74-9a0f-13b253ae19cc';
const EXPECTED_OPP_ID = '9ce21126-fdf7-4058-9e39-b420a2328c95';

async function inspectAnswers() {
    console.log(`🔍 Fetching answers for user: ${USER_ID}...`);

    const { data: answers, error } = await supabase
        .from("audition_answers")
        .select("id, opportunity_id, question_id")
        .eq("user_id", USER_ID);

    if (error) {
        console.error("❌ Error fetching answers:", error);
        return;
    }

    console.log(`✅ Found ${answers.length} answers.`);
    if (answers.length > 0) {
        console.log("First answer opportunity_id:", answers[0].opportunity_id);
        console.log("Expected opportunity_id:   ", EXPECTED_OPP_ID);

        const matching = answers.filter(a => a.opportunity_id === EXPECTED_OPP_ID);
        console.log(`Matching answers: ${matching.length} / ${answers.length}`);
    }
}

inspectAnswers();
