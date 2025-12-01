
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

const TEST_OPPORTUNITY_ID = '550e8400-e29b-41d4-a716-446655440003';

async function linkProject() {
    const newProjectId = process.argv[2];

    if (!newProjectId) {
        console.error("❌ Please provide a VettedAI Project ID.");
        console.log("Usage: node link_project.js <PROJECT_UUID>");
        process.exit(1);
    }

    console.log(`🔗 Linking Test Opportunity to Project ID: ${newProjectId}...`);

    const { error } = await supabase
        .from('opportunities')
        .update({ vetted_project_id: newProjectId })
        .eq('id', TEST_OPPORTUNITY_ID);

    if (error) {
        console.error("❌ Error updating opportunity:", error);
    } else {
        console.log("✅ Successfully linked!");
        console.log(`   Opportunity ${TEST_OPPORTUNITY_ID} -> Project ${newProjectId}`);
        console.log("\nNow you can run 'bash manual_curl.sh' to test the submission.");
    }
}

linkProject();
