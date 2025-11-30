
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

const NEW_PROJECT_ID = '028367e7-5d63-48d8-8983-d97224ba75eb';

async function updateProject() {
    console.log(`🔍 Finding latest submission...`);

    const { data: submission, error: subError } = await supabase
        .from("audition_submissions")
        .select("id, opportunity_id")
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

    if (subError || !submission) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    console.log(`✅ Found Latest Submission ID: ${submission.id}`);
    console.log(`✅ Linked Opportunity ID: ${submission.opportunity_id}`);
    console.log(`🚀 Updating vetted_project_id to: ${NEW_PROJECT_ID}...`);

    const { error: updateError } = await supabase
        .from("opportunities")
        .update({ vetted_project_id: NEW_PROJECT_ID })
        .eq("id", submission.opportunity_id);

    if (updateError) {
        console.error("❌ Error updating opportunity:", updateError);
    } else {
        console.log("✅ Successfully updated vetted_project_id!");
    }
}

updateProject();
