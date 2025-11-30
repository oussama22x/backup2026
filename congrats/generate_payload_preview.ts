
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Use the submission ID found in previous steps or pass as arg
const SUBMISSION_ID = Deno.args[0] || "089cb973-8c19-4ab7-b5fc-133b5ba344f4";

async function generatePayload() {
    console.log(`🔍 Fetching data for submission: ${SUBMISSION_ID}...`);

    // 1. Fetch Submission
    const { data: submission, error: subError } = await supabase
        .from("audition_submissions")
        .select("*, audition_answers(*)")
        .eq("id", SUBMISSION_ID)
        .single();

    if (subError || !submission) {
        console.error("❌ Error fetching submission:", subError);
        return;
    }

    // 2. Fetch Opportunity for Vetted Project ID
    const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .select("vetted_project_id")
        .eq("id", submission.opportunity_id)
        .single();

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

    // 5. Map Answers
    const answers = submission.audition_answers.map((ans: any, index: number) => {
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
            audio_url: audioUrl
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
    console.log(JSON.stringify(payload, null, 2));
}

generatePayload();
