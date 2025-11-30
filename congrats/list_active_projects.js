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

const VETTED_SUPABASE_URL = process.env.VETTED_SUPABASE_URL || env.VETTED_SUPABASE_URL;
const VETTED_SUPABASE_KEY = process.env.VETTED_SUPABASE_KEY || env.VETTED_SUPABASE_KEY;

if (!VETTED_SUPABASE_URL || !VETTED_SUPABASE_KEY) {
    console.error("❌ Missing required environment variables.");
    process.exit(1);
}

const vettedSupabase = createClient(VETTED_SUPABASE_URL, VETTED_SUPABASE_KEY);

async function listActiveProjects() {
    console.log("🔍 Searching for ACTIVE projects in VettedAI DB...");

    const { data: projects, error } = await vettedSupabase
        .from('projects')
        .select('id, role_title, status')
        .eq('status', 'active') // Assuming 'active' is the status for published projects
        .limit(5);

    if (error) {
        console.error("❌ Error fetching projects:", error);
        return;
    }

    if (projects && projects.length > 0) {
        console.log(`✅ Found ${projects.length} active projects:`);
        projects.forEach(p => {
            console.log(`   - [${p.status}] ${p.role_title} (ID: ${p.id})`);
        });
    } else {
        console.log("⚠️  No ACTIVE projects found.");
    }
}

listActiveProjects();
