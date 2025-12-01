
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vetted API Config
const VETTED_API_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_audition_submission";
const WEBHOOK_SECRET = "81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0";
const VETTED_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzgwNDYsImV4cCI6MjA3NzM1NDA0Nn0.Fbvd5EO5M0JxFY8VMwW2dTeiZYaOPTho8UPij4rFLzE"; // Using the key from index.ts (wait, index.ts had a different key, I should use that one)
// The key in index.ts was: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjA0ODMsImV4cCI6MjA3ODQzNjQ4M30.kj21M-IqAu7utGr4EVDdhKB6-5Zf5UpAI0yo41Wjljw
const ACTUAL_VETTED_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjA0ODMsImV4cCI6MjA3ODQzNjQ4M30.kj21M-IqAu7utGr4EVDdhKB6-5Zf5UpAI0yo41Wjljw";

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Congrats Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSubmission() {
    console.log('Starting manual sync...');
    const targetId = '674acde9-6f6f-4a4f-b709-b4737ece702d';

    // 1. Find Submission
    const { data: subs, error: subError } = await supabase
        .from('audition_submissions')
        .select('*')
        .eq('opportunity_id', targetId)
        .order('submitted_at', { ascending: false })
        .limit(1);

    if (subError || !subs || subs.length === 0) {
        console.error('No submission found or error:', subError);
        return;
    }

    const submission = subs[0];
    console.log(`Processing submission: ${submission.id}`);

    // 2. Fetch User Details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(submission.user_id);
    let email = "unknown@example.com";
    let name = "Unknown Candidate";
    if (user) {
        email = user.email || email;
        name = user.user_metadata?.full_name || name;
    }

    if (name === "Unknown Candidate") {
        const { data: profile } = await supabase.from("talent_profiles").select("first_name, last_name, email").eq("user_id", submission.user_id).single();
        if (profile) {
            name = `${profile.first_name} ${profile.last_name}`;
            if (email === "unknown@example.com") email = profile.email || email;
        }
    }

    // 3. Fetch Resume
    let resumeUrl = null;
    const { data: resumeData } = await supabase.from("talent_files").select("file_url").eq("user_id", submission.user_id).eq("file_type", "resume").order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (resumeData?.file_url) {
        resumeUrl = resumeData.file_url;
        // Generate signed URL if needed
        if (!resumeUrl.startsWith('http')) {
            const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(resumeUrl, 31536000);
            if (signed) resumeUrl = signed.signedUrl;
        }
    }

    // 4. Fetch Answers
    const { data: answersData } = await supabase.from("audition_answers").select("*").eq("user_id", submission.user_id).eq("opportunity_id", submission.opportunity_id);

    const answers = [];
    if (answersData) {
        for (const ans of answersData) {
            let audioUrl = ans.audio_url;
            if (audioUrl && !audioUrl.startsWith("http")) {
                let { data: signed } = await supabase.storage.from("audition-recordings").createSignedUrl(audioUrl, 31536000);
                if (!signed) {
                    const { data: signedResume } = await supabase.storage.from("resumes").createSignedUrl(audioUrl, 31536000);
                    signed = signedResume;
                }
                if (signed) audioUrl = signed.signedUrl;
            }
            answers.push({
                question_id: ans.question_id || `Q${ans.question_index + 1}`,
                question_text: ans.question_text || "Question text missing",
                transcript: ans.transcript || ans.transcription || "",
                audio_url: audioUrl,
                submitted_at: ans.submitted_at || new Date().toISOString()
            });
        }
    }

    // 5. Direct Insert into Vetted DB
    console.log('Inserting directly into Vetted DB...');
    const vettedUrl = process.env.VETTED_SUPABASE_URL;
    const vettedKey = process.env.VETTED_SUPABASE_KEY;
    const supabaseVetted = createClient(vettedUrl, vettedKey);

    // 5a. Upsert Candidate
    let candidateId = null;
    const { data: existingCandidate, error: candError } = await supabaseVetted
        .from('candidates')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingCandidate) {
        console.log(`Candidate already exists: ${existingCandidate.id}`);
        candidateId = existingCandidate.id;
    } else {
        console.log('Creating new candidate...');
        const { data: newCandidate, error: createError } = await supabaseVetted
            .from('candidates')
            .insert([{
                email: email,
                name: name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (createError) {
            console.error('Error creating candidate:', createError);
            return;
        }
        candidateId = newCandidate.id;
        console.log(`Created candidate: ${candidateId}`);
    }

    // 5b. Upsert Project Candidate
    const { data: existingLink, error: linkError } = await supabaseVetted
        .from('project_candidates')
        .select('id')
        .eq('project_id', targetId)
        .eq('candidate_id', candidateId)
        .maybeSingle();

    if (existingLink) {
        console.log('Candidate already linked to project.');
    } else {
        console.log('Linking candidate to project...');
        const { error: linkCreateError } = await supabaseVetted
            .from('project_candidates')
            .insert([{
                project_id: targetId,
                candidate_id: candidateId,
                status: 'awaiting',
                decision_status: 'shortlisted', // Force shortlist visibility
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (linkCreateError) {
            console.error('Error linking candidate:', linkCreateError);
        } else {
            console.log('✅ Candidate successfully linked to project!');
        }
    }
}

syncSubmission();
