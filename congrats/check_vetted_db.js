
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const vettedUrl = process.env.VETTED_SUPABASE_URL;
const vettedKey = process.env.VETTED_SUPABASE_KEY;

if (!vettedUrl || !vettedKey) {
    console.error('Missing Vetted Supabase credentials');
    process.exit(1);
}

const supabase = createClient(vettedUrl, vettedKey);

async function checkVettedCandidates() {
    console.log('Searching Vetted DB for scaffold containing "low-light"...');

    // We can't easily ILIKE on a JSONB column in Supabase JS client without RPC usually, 
    // but we can try text search or just fetch all and filter (if not too many).
    // Let's try fetching a batch of scaffolds and searching in memory for now.

    const { data: scaffolds, error: sError } = await supabase
        .from('audition_scaffolds')
        .select('id, role_definition_id, scaffold_data')
        .range(0, 1000);

    if (sError) {
        console.error('Error fetching scaffolds:', sError);
    } else {
        console.log(`Fetched ${scaffolds.length} scaffolds. Searching...`);
        const found = scaffolds.find(s => {
            const str = JSON.stringify(s.scaffold_data);
            return str.includes('Q013');
        });

        if (found) {
            console.log(`\n✅ FOUND SCAFFOLD!`);
            console.log(`Scaffold ID: ${found.id}`);
            console.log(`Role Def ID: ${found.role_definition_id}`);
            const data = typeof found.scaffold_data === 'string' ? JSON.parse(found.scaffold_data) : found.scaffold_data;
            // console.log("Raw Scaffold Data:", JSON.stringify(data, null, 2));

            if (data.questions) {
                const firstQ = data.questions[0];
                console.log(`First Question ID: ${firstQ.question_id}`);

                // Find Project
                const { data: roleDef, error: rdError } = await supabase
                    .from('role_definitions')
                    .select('project_id')
                    .eq('id', found.role_definition_id)
                    .single();

                if (rdError || !roleDef) {
                    console.log("⚠️ Could not find role definition or project_id.");
                } else {
                    console.log(`✅ Project ID: ${roleDef.project_id}`);

                    const { data: project, error: pError } = await supabase
                        .from('projects')
                        .select('role_title')
                        .eq('id', roleDef.project_id)
                        .single();

                    if (project) {
                        console.log(`✅ Project Title: ${project.role_title}`);
                    }
                }
            }
            process.exit(0);
        } else {
            console.log('❌ No scaffold found containing "low-light" in the first 50 records.');
        }
    }
}

checkVettedCandidates();
