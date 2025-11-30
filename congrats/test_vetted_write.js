
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

const VETTED_URL = env.VETTED_SUPABASE_URL;
const VETTED_KEY = env.VETTED_SUPABASE_KEY;

if (!VETTED_URL || !VETTED_KEY) {
    console.error("❌ Missing VETTED_SUPABASE_URL or VETTED_SUPABASE_KEY in backend/.env");
    process.exit(1);
}

const supabase = createClient(VETTED_URL, VETTED_KEY);

const SCAFFOLD_ID = '15668cad-ac6d-401c-8779-3d8587fb8341'; // AI Workflow Architect Scaffold

async function testWriteAccess() {
    console.log(`Testing write access to Scaffold ${SCAFFOLD_ID}...`);

    // 1. Fetch current data
    const { data: current, error: fetchError } = await supabase
        .from('audition_scaffolds')
        .select('scaffold_data')
        .eq('id', SCAFFOLD_ID)
        .single();

    if (fetchError) {
        console.error("❌ Error fetching scaffold:", fetchError);
        return;
    }

    const data = typeof current.scaffold_data === 'string' ? JSON.parse(current.scaffold_data) : current.scaffold_data;

    // 2. Modify data (add a test timestamp)
    data.last_checked_by_congrats = new Date().toISOString();

    // 3. Try to update
    const { error: updateError } = await supabase
        .from('audition_scaffolds')
        .update({ scaffold_data: data })
        .eq('id', SCAFFOLD_ID);

    if (updateError) {
        console.error("❌ Write access DENIED:", updateError);
    } else {
        console.log("✅ Write access GRANTED! We can auto-heal broken projects.");
    }
}

testWriteAccess();
