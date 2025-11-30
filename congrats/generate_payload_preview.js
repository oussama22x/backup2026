
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
                // Remove quotes if present
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

// Try to load from backend/.env (relative to congrats folder or root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load backend .env specifically to get the service role key
const backendEnvPath = path.join(__dirname, 'backend/.env');
const localEnvPath = path.join(__dirname, '.env');

let env = {};
if (fs.existsSync(backendEnvPath)) {
    Object.assign(env, loadEnv(backendEnvPath));
}
if (fs.existsSync(localEnvPath)) {
    Object.assign(env, loadEnv(localEnvPath));
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL;
// Prioritize env.SUPABASE_SERVICE_ROLE_KEY from backend/.env
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.error("Tried loading from:", envPath);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Use the submission ID found in previous steps or pass as arg
let SUBMISSION_ID = process.argv[2];

async function generatePayload() {
    // If no ID provided, fetch the latest one
    if (!SUBMISSION_ID) {
        const { data: latestSub, error: latestError } = await supabase
            .from("audition_submissions")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (latestSub) {
            SUBMISSION_ID = latestSub.id;
        } else {
            console.error("❌ No submissions found in database.");
            return;
        }
    }

    console.log(`🔍 Fetching data for submission: ${SUBMISSION_ID}...`);

    // 1. Fetch Submission
    const { data: submission, error: subError } = await supabase
        .from("audition_submissions")
        .select("*")
        .eq("id", SUBMISSION_ID)
        .single();

    if (subError || !submission) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    console.log("Submission Data:", {
        id: submission.id,
        user_id: submission.user_id,
        opportunity_id: submission.opportunity_id
    });

    // DEBUG: List all opportunities
    const { data: allOpps, error: allOppsError } = await supabase
    // 2. Fetch Opportunity for Vetted Project ID
    const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .select("vetted_project_id")
        .eq("id", submission.opportunity_id)
        .maybeSingle();

    console.log("Opportunity Data (fetched by ID):", opportunity);

    let projectId = opportunity?.vetted_project_id;
    if (!projectId) {
        projectId = submission.opportunity_id;
    }

    // Check if projectId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
        projectId = "a0a84e05-e560-4901-bfcb-a23ba70610e2"; // Fallback
    }

    // 3. Fetch User
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(submission.user_id);

    let email = "unknown@example.com";
    let name = "Unknown Candidate";

    if (user) {
        email = user.email || email;
        name = user.user_metadata?.full_name || name;
    } else {
        // Fallback: Try fetching from talent_profiles if auth user not found (rare)
        const { data: profile } = await supabase.from("talent_profiles").select("first_name, last_name, email").eq("user_id", submission.user_id).single();
        if (profile) {
            name = `${profile.first_name} ${profile.last_name}`;
            email = profile.email || email;
        }
    }

    // 4. Fetch Resume
    const { data: resumeData } = await supabase
        .from("talent_files")
        .select("file_url")
        .eq("user_id", submission.user_id)
        .eq("file_type", "resume")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    let resumeUrl = resumeData?.file_url;
    if (resumeUrl && !resumeUrl.startsWith("http")) {
        // Generate signed URL
        // Try 'resumes' bucket first as per edge function logic
        let bucket = "resumes";
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(resumeUrl, 3600);
        if (signed) resumeUrl = signed.signedUrl;
    }

    // 5. Fetch Answers (Separate query to avoid join issues)
    const { data: answersData, error: answersError } = await supabase
        .from("audition_answers")
        .select("*")
        .eq("user_id", submission.user_id);

    if (answersError) {
        console.error("❌ Error fetching answers:", answersError);
        return;
    }

    // 6. Map Answers
    const answers = answersData.map((ans, index) => {
        let audioUrl = ans.audio_url;
        // Mock signed URL generation for display purposes if it's not already http
        if (audioUrl && !audioUrl.startsWith("http")) {
            audioUrl = `[SIGNED_URL_FOR_${audioUrl}]`;
        }

        const questionId = ans.question_id || `Q${ans.question_index + 1}`;
        const questionText = ans.question_text || `Question ${index + 1}`;
        const transcript = ans.transcript || ans.transcription || "";

        return {
            question_id: questionId,
            question_text: questionText,
            transcript: transcript,
            audio_url: audioUrl,
            submitted_at: ans.submitted_at || new Date().toISOString()
        };
    });

    // 6. Construct Payload
    const payload = {
        submission_id: submission.id,
        project_id: projectId,
        email: email,
        name: name,
        resume_url: resumeUrl || "No resume found",
        answers: answers
    };

    console.log("\n📦 GENERATED PAYLOAD FOR VETTEDAI:\n");
    const jsonPayload = JSON.stringify(payload, null, 2);
    console.log(jsonPayload);
    fs.writeFileSync('payload.json', jsonPayload);
    console.log("\n✅ Payload saved to payload.json");
}

generatePayload();
