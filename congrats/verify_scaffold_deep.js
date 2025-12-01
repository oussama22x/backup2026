
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

const PROJECT_ID = 'ff395a72-ddb8-4693-a46a-09a0b5a53585'; // Product Role (Internal)

async function verifyScaffold() {
    console.log(`🔍 Fetching Project: ${PROJECT_ID}...`);

    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', PROJECT_ID)
        .single();

    if (pError) {
        console.error("❌ Error fetching project:", pError);
        return;
    }
    console.log("✅ Project keys:", Object.keys(project));
    console.log("✅ Project found:", project.role_title);

    console.log("🔍 Checking if 'role_definitions' table exists...");
    const { data: rd, error: rdError } = await supabase
        .from('role_definitions')
        .select('*')
        .limit(1);

    if (rdError) {
        console.log("ℹ️ 'role_definitions' table access error (or does not exist):", rdError.message);
    } else {
        console.log("✅ 'role_definitions' table exists. Keys:", Object.keys(rd[0] || {}));
    }

    console.log(`🔍 Finding Role Definition for Project ID: ${PROJECT_ID}...`);
    const { data: roleDef, error: rdError2 } = await supabase
        .from('role_definitions')
        .select('*')
        .eq('project_id', PROJECT_ID)
        .single();

    if (rdError2) {
        console.error("❌ Error fetching role definition:", rdError2);
        return;
    }
    console.log("✅ Role Definition found:", roleDef.id);

    console.log(`🔍 Finding Scaffold for Role Definition ID: ${roleDef.id}...`);
    const { data: scaffold, error: sError } = await supabase
        .from('audition_scaffolds')
        .select('*')
        .eq('role_definition_id', roleDef.id)
        .single();

    if (sError) {
        console.error("❌ Error fetching scaffold:", sError);
        return;
    }

    console.log("✅ Scaffold found:", scaffold.id);
    console.log("✅ Scaffold Data Keys:", Object.keys(scaffold.scaffold_data));

    if (scaffold.definition_snapshot) {
        console.log("📸 Definition Snapshot found!");
        console.log("Snapshot Keys:", Object.keys(scaffold.definition_snapshot));
        // Check for questions in snapshot
        const snap = typeof scaffold.definition_snapshot === 'string' ? JSON.parse(scaffold.definition_snapshot) : scaffold.definition_snapshot;
        if (snap.questions) {
            console.log("Snapshot Questions found:", snap.questions.length);
            snap.questions.forEach(q => console.log(`- Snap ID: ${q.id} | Text: ${q.text ? q.text.substring(0, 30) : 'No text'}...`));
        }
        if (snap.definition_data) {
            console.log("Snapshot Definition Data Keys:", Object.keys(snap.definition_data));
            // Check for questions in definition_data
            if (snap.definition_data.questions) {
                console.log("Snapshot Def Data Questions found:", snap.definition_data.questions.length);
                snap.definition_data.questions.forEach(q => console.log(`- Def ID: ${q.id} | Text: ${q.text ? q.text.substring(0, 30) : 'No text'}...`));
            }
        }
    } else {
        console.log("❌ No definition_snapshot found.");
    }


    const bankId = scaffold.scaffold_data.bank_id;
    console.log("🏦 Bank ID:", bankId);

    if (bankId) {
        console.log(`🔍 Fetching Question Bank ${bankId}...`);
        const { data: bank, error: bankError } = await supabase
            .from('question_banks') // Guessing table name
            .select('*')
            .eq('id', bankId)
            .single();

        if (bankError) {
            console.log("ℹ️ Error fetching question bank (or table doesn't exist):", bankError.message);
        } else {
            console.log("✅ Question Bank found!");
            console.log("Bank Keys:", Object.keys(bank));
            // Check if bank has questions with IDs
            if (bank.data && bank.data.questions) {
                console.log("Bank Questions found:", bank.data.questions.length);
                bank.data.questions.forEach(q => console.log(`- ID: ${q.id} | Text: ${q.text.substring(0, 30)}...`));
            }
        }
    }

    process.exit(0);
}

verifyScaffold();
