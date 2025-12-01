
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

const PROJECT_ID_OR_TITLE = process.argv[2];

if (!PROJECT_ID_OR_TITLE) {
    console.log("Usage: node verify_new_project.js <Project ID or Title>");
    process.exit(1);
}

async function verifyProject() {
    console.log(`🔍 Searching for project: "${PROJECT_ID_OR_TITLE}"...`);

    let project;

    // Check if input is UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(PROJECT_ID_OR_TITLE);

    if (isUUID) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', PROJECT_ID_OR_TITLE)
            .single();
        if (error) {
            console.error("❌ Error fetching project by ID:", error.message);
            return;
        }
        project = data;
    } else {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .ilike('role_title', `%${PROJECT_ID_OR_TITLE}%`)
            .limit(1)
            .single();
        if (error) {
            console.error("❌ Error fetching project by title:", error.message);
            return;
        }
        project = data;
    }

    console.log(`✅ Found Project: "${project.role_title}" (ID: ${project.id})`);

    // Find Role Definition
    const { data: roleDef, error: rdError } = await supabase
        .from('role_definitions')
        .select('id')
        .eq('project_id', project.id)
        .single();

    if (rdError || !roleDef) {
        console.error("❌ Role Definition NOT found. This project might be incomplete.");
        return;
    }

    // Find Scaffold
    const { data: scaffold, error: sError } = await supabase
        .from('audition_scaffolds')
        .select('scaffold_data')
        .eq('role_definition_id', roleDef.id)
        .single();

    if (sError || !scaffold) {
        console.error("❌ Scaffold NOT found. This project has no interview questions generated yet.");
        return;
    }

    const data = typeof scaffold.scaffold_data === 'string' ? JSON.parse(scaffold.scaffold_data) : scaffold.scaffold_data;

    if (!data.questions || data.questions.length === 0) {
        console.error("❌ Scaffold has NO questions.");
        return;
    }

    const firstQ = data.questions[0];
    const hasIds = !!(firstQ.question_id || firstQ.id);

    if (hasIds) {
        console.log("\n✅ SUCCESS: This project has explicit Question IDs.");
        console.log(`   Example ID: ${firstQ.question_id || firstQ.id}`);
        console.log("   🚀 You can safely link this project to Congrats!");
    } else {
        console.log("\n❌ FAILURE: This project DOES NOT have explicit Question IDs.");
        console.log("   The system will NOT work automatically with this project.");
        console.log("   Please regenerate the scaffold in VettedAI or choose a different project.");
    }
}

verifyProject();
