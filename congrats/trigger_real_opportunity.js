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

// Valid Vetted Project ID (Product Operations Lead)
const VETTED_PROJECT_ID = "11bd4029-3508-4928-8825-38f3b3167ca9";

async function createRealOpportunity() {
    console.log("🚀 Creating a REAL Opportunity in the database...");

    const newOpportunity = {
        title: "Real Test Opportunity (Automated)",
        status: "active",
        vetted_project_id: VETTED_PROJECT_ID,
        company: "CongratsAI Test",
        location: "Remote",
        type: "Contract",
        rate: "$100/hr",
        skills: ["Testing", "Automation"]
    };

    const { data, error } = await supabase
        .from('opportunities')
        .insert(newOpportunity)
        .select()
        .single();

    if (error) {
        console.error("❌ Error creating opportunity:", error);
        return;
    }

    console.log("✅ Opportunity Created Successfully!");
    console.log(`   ID: ${data.id}`);
    console.log(`   Title: ${data.title}`);
    console.log(`   Vetted Project ID: ${data.vetted_project_id}`);
    console.log("\n⏳ If the SQL Trigger is active, the Edge Function should run momentarily.");
    console.log("👉 Check your Supabase Dashboard > Edge Functions > notify-opportunity-creation > Logs");
}

createRealOpportunity();
