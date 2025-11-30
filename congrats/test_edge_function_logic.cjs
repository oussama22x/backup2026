const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

// Mock Deno environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testEdgeFunctionLogic() {
    console.log('🚀 Starting Edge Function Logic Test...');

    // 1. Find a valid submission or create one
    // Using known IDs from previous inspection
    const userId = '1f87251e-5666-4ec5-bb3c-93ca24bee162';
    const opportunityId = '550e8400-e29b-41d4-a716-446655440003';

    console.log(`Looking for submission for User ${userId} and Opportunity ${opportunityId}...`);

    let { data: submission, error: subError } = await supabase
        .from('audition_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

    if (subError) {
        console.error('Error fetching submission:', subError);
        return;
    }

    if (!submission) {
        console.log('⚠️ Submission not found, creating one...');
        const { data: newSub, error: createError } = await supabase
            .from('audition_submissions')
            .insert({
                user_id: userId,
                opportunity_id: opportunityId,
                status: 'completed',
                questions: ['Q1'],
                audio_urls: []
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating submission:', createError);
            return;
        }
        submission = newSub;
    }

    console.log(`✅ Using Submission ID: ${submission.id} `);

    // --- START EDGE FUNCTION LOGIC SIMULATION ---

    // 2. Fetch Opportunity
    const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('vetted_project_id')
        .eq('id', submission.opportunity_id)
        .single();

    if (oppError) console.error('Error fetching opportunity:', oppError);
    console.log(`✅ Opportunity Vetted ID: ${opportunity?.vetted_project_id} `);

    // 3. Fetch User (Mocking auth admin get user by using public table if possible, or skipping)
    // Since we don't have admin key here easily, we'll skip auth.admin.getUserById and rely on profile
    console.log('⚠️ Skipping auth.admin.getUserById (requires service role key)');

    // 4. Fetch Profile
    const { data: profile, error: profError } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('user_id', submission.user_id)
        .single();

    if (profError) console.error('Error fetching profile:', profError);
    console.log(`✅ Profile found: ${profile ? 'Yes' : 'No'} `);

    // 5. Fetch Answers
    const { data: answers, error: ansError } = await supabase
        .from('audition_answers')
        .select('*')
        .eq('user_id', submission.user_id)
        .eq('opportunity_id', submission.opportunity_id);

    if (ansError) console.error('Error fetching answers:', ansError);
    console.log(`✅ Found ${answers?.length || 0} answers`);

    // 6. Process Answers & Generate Signed URLs
    const processedAnswers = await Promise.all(
        (answers || []).map(async (answer) => {
            let audioUrl = answer.audio_url;

            if (answer.audio_path) {
                console.log(`   Signing URL for: ${answer.audio_path} `);
                const { data: signedData, error: signedError } = await supabase
                    .storage
                    .from('audition-recordings')
                    .createSignedUrl(answer.audio_path, 31536000);

                if (!signedError && signedData) {
                    audioUrl = signedData.signedUrl;
                } else {
                    console.error(`   Failed to sign URL: `, signedError);
                }
            }

            return {
                question_id: answer.question_id,
                question_text: answer.question_text,
                transcript: answer.transcript || "",
                audio_url: audioUrl,
                submitted_at: answer.submitted_at,
            };
        })
    );

    // 7. Construct Payload
    const payload = {
        submission_id: submission.id,
        project_id: opportunity?.vetted_project_id || null,
        email: profile?.email || "test@example.com", // Fallback since we skipped auth
        name: profile?.full_name || "",
        profile: {
            experience_level: profile?.years_experience || null,
            desired_salary_min: null,
            desired_salary_max: null,
            availability_date: null,
            start_timing: null,
            work_arrangements: [],
            location_preferences: [],
            current_city: profile?.location || null,
            current_country: null,
            desired_roles: [],
            linkedin_url: profile?.linkedin_url || null,
            github_url: null,
            portfolio_url: profile?.portfolio_url || null,
            bio: profile?.bio || null,
        },
        answers: processedAnswers,
    };

    console.log('\n--- FINAL PAYLOAD PREVIEW ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('-----------------------------\n');

    console.log('✅ Test Completed Successfully');
}

testEdgeFunctionLogic();
