
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

const OPP_ID = '550e8400-e29b-41d4-a716-446655440001';

async function verifyUpdate() {
    console.log(`🔍 Fetching opportunity: ${OPP_ID}...`);

    const { data: opportunity, error } = await supabase
        .from("opportunities")
        .select("id, vetted_project_id")
        .eq("id", OPP_ID)
        .maybeSingle();

    if (error) {
        console.error("❌ Error fetching opportunity:", error);
    } else if (!opportunity) {
        console.error("❌ Opportunity not found!");
    } else {
        console.log("✅ Opportunity Data:", opportunity);
        console.log(`vetted_project_id is: ${opportunity.vetted_project_id}`);
    }

    // List all opportunities
    console.log("\n📋 Listing all opportunities:");
    const { data: allOpps } = await supabase.from("opportunities").select("id, vetted_project_id");
    console.log(allOpps);

    // Try update again with select to see if it returns anything
    console.log("\n🔄 Attempting update again with select...");
    const { data: updated, error: updateError } = await supabase
        .from("opportunities")
        .update({ vetted_project_id: 'ff395a72-ddb8-4693-a46a-09a0b5a53585' })
        .eq("id", OPP_ID)
        .select();

    if (updateError) console.error("Update Error:", updateError);
    console.log("Update Result:", updated);
}

verifyUpdate();
