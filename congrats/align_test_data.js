
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

const SUBMISSION_ID = 'ce9885cb-7693-4311-b5ad-3c833471fa48';
const VALID_PROJECT_ID = '674acde9-6f6f-4a4f-b709-b4737ece702d'; // AI Workflow Architect

async function alignTestData() {
    console.log(`🔍 Fetching submission: ${SUBMISSION_ID}...`);

    const { data: submission, error: subError } = await supabase
        .from("audition_submissions")
        .select("id, user_id, opportunity_id")
        .eq("id", SUBMISSION_ID)
        .single();

    if (subError || !submission) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    console.log(`✅ Found Submission.`);
    console.log(`Opportunity ID: ${submission.opportunity_id}`);

    // 1. Update Opportunity to point to valid Vetted Project
    console.log(`🚀 Updating Opportunity to point to Project: ${VALID_PROJECT_ID}...`);
    const { error: oppError } = await supabase
        .from("opportunities")
        .update({ vetted_project_id: VALID_PROJECT_ID })
        .eq("id", submission.opportunity_id);

    if (oppError) {
        console.error("❌ Error updating opportunity:", oppError);
        return;
    }
    console.log("✅ Opportunity updated.");

    // 2. Patch Answers to use valid Question IDs for this project
    // We'll map whatever is there (Q1, Q2, Q3 or ML1, ML2, ML3) to valid IDs
    // Valid IDs from previous check: Q013_A3_experiment_design, Q015_J1_ethical_tradeoff, Q006_E2_define_done

    const validQuestions = [
        'Q013_A3_experiment_design',
        'Q015_J1_ethical_tradeoff',
        'Q006_E2_define_done'
    ];

    console.log("🔍 Fetching current answers to patch...");
    const { data: answers, error: ansError } = await supabase
        .from("audition_answers")
        .select("id, question_id")
        .eq("user_id", submission.user_id)
        .eq("opportunity_id", submission.opportunity_id);

    if (ansError) {
        console.error("❌ Error fetching answers:", ansError);
        return;
    }

    console.log(`Found ${answers.length} answers.`);

    for (let i = 0; i < answers.length; i++) {
        const ans = answers[i];
        const newQId = validQuestions[i % validQuestions.length]; // Cycle through valid IDs if more answers than valid IDs

        console.log(`🔄 Patching Answer ${ans.id} (${ans.question_id}) -> ${newQId}...`);

        const { error: updateError } = await supabase
            .from("audition_answers")
            .update({ question_id: newQId })
            .eq("id", ans.id);

        if (updateError) {
            console.error(`❌ Error updating answer ${ans.id}:`, updateError);
        } else {
            console.log(`✅ Updated answer ${ans.id} to ${newQId}`);
        }
    }
}

alignTestData();
