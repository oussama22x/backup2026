
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

const PROJECT_ID = '674acde9-6f6f-4a4f-b709-b4737ece702d'; // AI Workflow Architect

async function breakScaffold() {
    console.log(`🔨 Breaking scaffold for Project ID: ${PROJECT_ID}...`);

    // Find Role Definition
    const { data: roleDef } = await supabase
        .from('role_definitions')
        .select('id')
        .eq('project_id', PROJECT_ID)
        .single();

    // Find Scaffold
    const { data: scaffold } = await supabase
        .from('audition_scaffolds')
        .select('id, scaffold_data')
        .eq('role_definition_id', roleDef.id)
        .single();

    const data = typeof scaffold.scaffold_data === 'string' ? JSON.parse(scaffold.scaffold_data) : scaffold.scaffold_data;

    // Remove IDs
    if (data.questions) {
        data.questions = data.questions.map(q => {
            const { question_id, id, ...rest } = q;
            return rest;
        });
    }

    // Update
    const { error } = await supabase
        .from('audition_scaffolds')
        .update({ scaffold_data: data })
        .eq('id', scaffold.id);

    if (error) {
        console.error("❌ Failed to break scaffold:", error);
    } else {
        console.log("✅ Scaffold BROKEN! IDs removed.");
    }
}

breakScaffold();
