
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

const OLD_PROJECT_ID = 'ff395a72-ddb8-4693-a46a-09a0b5a53585';
const NEW_PROJECT_ID = 'f510690e-42e8-41f7-ab58-bc5f93f84674'; // Senior Product Manager

async function fixProductRole() {
    console.log(`🔄 Updating 'Product Role' opportunity from ${OLD_PROJECT_ID} to ${NEW_PROJECT_ID}...`);

    const { data, error } = await supabase
        .from('opportunities')
        .update({ vetted_project_id: NEW_PROJECT_ID })
        .eq('vetted_project_id', OLD_PROJECT_ID)
        .select();

    if (error) {
        console.error("❌ Error updating opportunity:", error);
    } else if (data.length === 0) {
        console.log("⚠️ No opportunity found with the old Project ID. It might have been updated already.");
        // Try finding by title
        const { data: titleData, error: titleError } = await supabase
            .from('opportunities')
            .update({ vetted_project_id: NEW_PROJECT_ID })
            .ilike('title', '%Product Role%')
            .select();

        if (titleError) console.error("❌ Error updating by title:", titleError);
        else console.log(`✅ Updated ${titleData.length} opportunities by title.`);
    } else {
        console.log(`✅ Successfully updated ${data.length} opportunities.`);
    }
}

fixProductRole();
