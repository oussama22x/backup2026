
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

const SUBMISSION_ID = '089cb973-8c19-4ab7-b5fc-133b5ba344f4';
const USER_ID = '20e327f2-996b-4b74-9a0f-13b253ae19cc';
const VALID_OPP_ID = '550e8400-e29b-41d4-a716-446655440001';
const REAL_VETTED_PROJECT_ID = 'ff395a72-ddb8-4693-a46a-09a0b5a53585';

async function fixDataIntegrity() {
    console.log("🚀 Starting Data Integrity Fix...");

    // 1. Update Opportunity with Real Vetted Project ID
    console.log(`1️⃣ Updating Opportunity ${VALID_OPP_ID} with vetted_project_id: ${REAL_VETTED_PROJECT_ID}...`);
    const { error: oppError } = await supabase
        .from("opportunities")
        .update({ vetted_project_id: REAL_VETTED_PROJECT_ID })
        .eq("id", VALID_OPP_ID);

    if (oppError) console.error("❌ Error updating opportunity:", oppError);
    else console.log("✅ Opportunity updated.");

    // 2. Update Submission to point to Valid Opportunity
    console.log(`2️⃣ Updating Submission ${SUBMISSION_ID} to point to opportunity: ${VALID_OPP_ID}...`);
    const { error: subError } = await supabase
        .from("audition_submissions")
        .update({ opportunity_id: VALID_OPP_ID })
        .eq("id", SUBMISSION_ID);

    if (subError) console.error("❌ Error updating submission:", subError);
    else console.log("✅ Submission updated.");

    // 3. Update Answers to point to Valid Opportunity
    console.log(`3️⃣ Updating Answers for user ${USER_ID} to point to opportunity: ${VALID_OPP_ID}...`);
    const { error: ansError } = await supabase
        .from("audition_answers")
        .update({ opportunity_id: VALID_OPP_ID })
        .eq("user_id", USER_ID);

    if (ansError) console.error("❌ Error updating answers:", ansError);
    else console.log("✅ Answers updated.");
}

fixDataIntegrity();
