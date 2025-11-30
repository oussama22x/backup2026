
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to load env vars
function loadEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
    return env;
}

const env = loadEnv(path.join(process.cwd(), 'backend/.env'));

const VETTED_URL = env.VETTED_SUPABASE_URL;
const VETTED_KEY = env.VETTED_SUPABASE_KEY;
const CONGRATS_URL = env.SUPABASE_URL;
const CONGRATS_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!VETTED_URL || !VETTED_KEY || !CONGRATS_URL || !CONGRATS_KEY) {
    console.error("❌ Missing environment variables.");
    process.exit(1);
}

const vettedSupabase = createClient(VETTED_URL, VETTED_KEY);
const congratsSupabase = createClient(CONGRATS_URL, CONGRATS_KEY);

const OPPORTUNITY_ID = "98420d72-251d-4b92-9539-6fd0657c695a";
const USER_ID = "eac0205f-e959-49a2-8509-b09b928cb0fa"; // Using the same user

async function simulate() {
    console.log(`🤖 Simulating Frontend Submission...`);
    console.log(`🎯 Opportunity: ${OPPORTUNITY_ID}`);

    // 1. Fetch correct questions from Vetted (Mimics Frontend/Backend logic)
    console.log(`📥 Fetching valid questions from VettedAI...`);

    // Get role def id
    const { data: roleData, error: roleError } = await vettedSupabase
        .from('role_definitions')
        .select('id')
        .eq('project_id', OPPORTUNITY_ID)
        .single();

    if (roleError) {
        console.error("❌ Error fetching role:", roleError);
        return;
    }

    // Get scaffold
    const { data: scaffoldData, error: scaffoldError } = await vettedSupabase
        .from('audition_scaffolds')
        .select('scaffold_data')
        .eq('role_definition_id', roleData.id)
        .single();

    if (scaffoldError) {
        console.error("❌ Error fetching scaffold:", scaffoldError);
        return;
    }

    const validQuestions = scaffoldData.scaffold_data.questions;
    console.log(`✅ Found ${validQuestions.length} valid questions.`);
    console.log(`   First ID: ${validQuestions[0].question_id}`);

    // 2. Create Submission in Congrats (Mimics Frontend Submit)
    console.log(`📝 Creating submission in Congrats DB...`);

    const { data: submission, error: subError } = await congratsSupabase
        .from('audition_submissions')
        .insert({
            user_id: USER_ID,
            opportunity_id: OPPORTUNITY_ID,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            questions: validQuestions,
            audio_urls: [] // Dummy empty array
        })
        .select()
        .single();

    if (subError) {
        console.error("❌ Error creating submission:", subError);
        return;
    }

    console.log(`✅ Submission created: ${submission.id}`);

    // 3. Create Answers with VALID IDs (This is what the fixed frontend does)
    console.log(`Floppy disk Creating answers with VALID IDs...`);

    const answersToInsert = validQuestions.map((q, index) => ({
        user_id: USER_ID,
        opportunity_id: OPPORTUNITY_ID,
        // submission_id: submission.id, // Note: Schema might not have this column based on previous errors, but we use user_id/opp_id
        question_id: q.question_id, // <--- THE KEY FIX: Using the real ID
        transcription: `Simulated answer for ${q.question_id}`,
        audio_url: `https://example.com/simulated_audio_${index}.webm` // Dummy URL
    }));

    const { error: ansError } = await congratsSupabase
        .from('audition_answers')
        .insert(answersToInsert);

    if (ansError) {
        console.error("❌ Error creating answers:", ansError);
        return;
    }

    console.log(`✅ Successfully inserted ${answersToInsert.length} answers with CORRECT IDs.`);
    console.log(`🚀 Ready to trigger test!`);
}

simulate();
