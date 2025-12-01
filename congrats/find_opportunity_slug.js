
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

async function findOpportunity() {
    console.log("🔍 Listing all opportunities to find 'operations-trainee'...");

    const { data: opps, error } = await supabase
        .from("opportunities")
        .select("*");

    if (error) {
        console.error("❌ Error fetching opportunities:", error);
        return;
    }

    console.log(`Found ${opps.length} opportunities.`);

    const match = opps.find(o => o.slug === 'operations-trainee' || o.title === 'Operations Trainee' || o.id === 'operations-trainee');

    if (match) {
        console.log("✅ Found matching opportunity:", match);
    } else {
        console.log("❌ No matching opportunity found for 'operations-trainee'.");
        console.log("Available slugs/titles:", opps.map(o => `${o.id} | ${o.slug} | ${o.title}`));
    }
}

findOpportunity();
