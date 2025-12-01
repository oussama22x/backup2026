
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
    console.error("❌ Missing VETTED_SUPABASE_URL or VETTED_SUPABASE_KEY");
    process.exit(1);
}

const supabase = createClient(VETTED_URL, VETTED_KEY);

async function findProductProject() {
    console.log('Searching for projects with "Product" in title...');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, role_title, created_at')
        .ilike('role_title', '%Product%')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    console.log(`Found ${projects.length} projects.`);
    for (const p of projects) {
        console.log(`- Title: "${p.role_title}" | ID: ${p.id}`);

        // Check if it has a valid scaffold with IDs
        console.log(`  Checking scaffold for ${p.id}...`);

        // Get Role Def
        const { data: roleDef } = await supabase
            .from('role_definitions')
            .select('id')
            .eq('project_id', p.id)
            .single();

        if (roleDef) {
            const { data: scaffold } = await supabase
                .from('audition_scaffolds')
                .select('scaffold_data')
                .eq('role_definition_id', roleDef.id)
                .single();

            if (scaffold) {
                const data = typeof scaffold.scaffold_data === 'string' ? JSON.parse(scaffold.scaffold_data) : scaffold.scaffold_data;
                if (data.questions && data.questions.length > 0) {
                    const firstQ = data.questions[0];
                    if (firstQ.question_id || firstQ.id) {
                        console.log(`  ✅ VALID SCAFFOLD! First QID: ${firstQ.question_id || firstQ.id}`);
                    } else {
                        console.log(`  ❌ Invalid scaffold (no explicit IDs).`);
                    }
                }
            }
        }
    }
}

findProductProject();
