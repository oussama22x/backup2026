#!/usr/bin/env node

/**
 * Backfill Script for VettedAI Webhook (Node.js version)
 * 
 * Purpose: Manually sync historical audition submissions from November 25-26, 2024
 * to the VettedAI webhook endpoint.
 * 
 * Usage:
 *   node backfill-vetted-submissions.mjs
 * 
 * Requirements:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const VETTED_API_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_audition_submission";
const WEBHOOK_SECRET = "81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0";
const VETTED_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjA0ODMsImV4cCI6MjA3ODQzNjQ4M30.kj21M-IqAu7utGr4EVDdhKB6-5Zf5UpAI0yo41Wjljw";

// Date range for backfill (November 26-27, 2025)
const START_DATE = "2025-11-26T00:00:00Z";
const END_DATE = "2025-11-27T23:59:59Z";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send payload to VettedAI with retry logic
 */
async function sendToVettedAI(payload) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`  🔄 Attempt ${attempt}/${MAX_RETRIES}...`);

            const response = await fetch(VETTED_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-webhook-secret": WEBHOOK_SECRET,
                    "Authorization": `Bearer ${VETTED_API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`  ✅ Success (${response.status}):`, data);
                return true;
            }

            // Client errors (4xx) - don't retry
            if (response.status >= 400 && response.status < 500) {
                const errorText = await response.text();
                console.error(`  ❌ Client Error (${response.status}):`, errorText);
                throw new Error(`Client error ${response.status}: ${errorText}`);
            }

            // Server errors (5xx) - retry
            if (response.status >= 500) {
                const errorText = await response.text();
                console.warn(`  ⚠️ Server Error (${response.status}):`, errorText);
                if (attempt < MAX_RETRIES) {
                    console.log(`  ⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }
            }

            throw new Error(`HTTP ${response.status}: ${await response.text()}`);

        } catch (error) {
            if (attempt === MAX_RETRIES) {
                throw error;
            }
            console.warn(`  ⚠️ Attempt ${attempt} failed:`, error.message);
            await sleep(RETRY_DELAY_MS);
        }
    }

    return false;
}

/**
 * Process a single submission
 */
async function processSubmission(supabase, submission) {
    const submissionId = submission.id;

    console.log(`\n📝 Processing submission: ${submissionId}`);
    console.log(`   User: ${submission.user_id}`);
    console.log(`   Opportunity: ${submission.opportunity_id}`);
    console.log(`   Submitted: ${submission.submitted_at}`);

    try {
        // 1. Fetch Opportunity details to get vetted_project_id
        console.log("  🏢 Fetching opportunity details...");
        const { data: opportunity, error: oppError } = await supabase
            .from("opportunities")
            .select("vetted_project_id")
            .eq("id", submission.opportunity_id)
            .single();

        if (oppError && oppError.code !== 'PGRST116') {
            console.warn("  ⚠️ Error fetching opportunity:", oppError.message);
        }

        // 2. Fetch User details (email, name)
        console.log("  👤 Fetching user details...");
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(submission.user_id);

        let email = "unknown@example.com";
        let name = "Unknown Candidate";

        if (user) {
            email = user.email || email;
            name = user.user_metadata?.full_name || name;
        } else {
            // Try fetching from talent_profiles
            const { data: profile } = await supabase
                .from("talent_profiles")
                .select("first_name, last_name")
                .eq("user_id", submission.user_id)
                .single();

            if (profile) {
                name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            }
        }

        console.log(`  📧 Email: ${email}`);
        console.log(`  👤 Name: ${name}`);

        // 3. Determine Project ID
        let projectId = opportunity?.vetted_project_id || submission.opportunity_id;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            console.log(`  ⚠️ Project ID "${projectId}" is not a UUID, using default VettedAI project`);
            projectId = "a0a84e05-e560-4901-bfcb-a23ba70610e2";
        }

        console.log(`  📋 Project ID: ${projectId}`);

        // 4. Fetch Resume
        console.log("  📄 Fetching resume...");
        const { data: resumeData } = await supabase
            .from("talent_files")
            .select("file_url")
            .eq("user_id", submission.user_id)
            .eq("file_type", "resume")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        let resumeUrl;

        if (resumeData?.file_url) {
            const rawResumeUrl = resumeData.file_url;

            if (rawResumeUrl.startsWith('http://') || rawResumeUrl.startsWith('https://')) {
                resumeUrl = rawResumeUrl;
                console.log("  ✅ Found public resume URL");
            } else {
                // Generate signed URL (1 year validity)
                console.log(`  🔗 Generating signed URL for resume...`);
                const { data: signedResume } = await supabase.storage
                    .from("talent-files")
                    .createSignedUrl(rawResumeUrl, 31536000); // 1 year

                if (signedResume) {
                    resumeUrl = signedResume.signedUrl;
                    console.log("  ✅ Generated signed resume URL");
                }
            }
        }

        // 5. Fetch Answers
        console.log("  🎤 Fetching answers...");
        const { data: answersData, error: answersError } = await supabase
            .from("audition_answers")
            .select("*")
            .eq("user_id", submission.user_id)
            .eq("opportunity_id", submission.opportunity_id);

        if (answersError) {
            throw new Error(`Error fetching answers: ${answersError.message}`);
        }

        if (!answersData || answersData.length === 0) {
            console.log("  ⚠️ No answers found - skipping");
            return {
                submission_id: submissionId,
                status: "skipped",
                error: "No answers found"
            };
        }

        console.log(`  ✅ Found ${answersData.length} answers`);

        // 6. Process Answers & Generate Signed URLs
        const answers = [];
        for (const ans of answersData) {
            let audioUrl = ans.audio_url;

            // Generate Signed URL if it's a storage path (not already http)
            if (audioUrl && !audioUrl.startsWith("http")) {
                console.log(`  🔗 Generating signed URL for audio: ${ans.question_id}...`);

                const { data: signed } = await supabase.storage
                    .from("audition-recordings")
                    .createSignedUrl(audioUrl, 31536000); // 1 year validity

                if (signed) {
                    audioUrl = signed.signedUrl;
                } else {
                    console.warn(`  ⚠️ Could not generate signed URL for: ${audioUrl}`);
                }
            }

            answers.push({
                question_id: ans.question_id || `Q${answers.length + 1}`,
                question_text: ans.question_text || "Question text missing",
                transcript: ans.transcript || ans.transcription || "",
                audio_url: audioUrl,
                submitted_at: ans.submitted_at || new Date().toISOString()
            });
        }

        // 7. Construct Payload
        const payload = {
            submission_id: submissionId,
            project_id: projectId,
            email: email,
            name: name,
            answers: answers
        };

        if (resumeUrl) {
            payload.resume_url = resumeUrl;
        }

        console.log("  📦 Payload constructed with", answers.length, "answers");

        // 8. Send to VettedAI
        console.log("  🚀 Sending to VettedAI...");
        const success = await sendToVettedAI(payload);

        if (success) {
            return {
                submission_id: submissionId,
                status: "success",
                project_id: projectId
            };
        } else {
            return {
                submission_id: submissionId,
                status: "failed",
                error: "Failed after retries",
                project_id: projectId
            };
        }

    } catch (error) {
        console.error(`  ❌ Error processing submission:`, error.message);
        return {
            submission_id: submissionId,
            status: "failed",
            error: error.message
        };
    }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
    console.log("🚀 VettedAI Backfill Script (Node.js)");
    console.log("=".repeat(80));
    console.log(`📅 Date Range: ${START_DATE} to ${END_DATE}`);
    console.log(`🎯 Target: ${VETTED_API_URL}`);
    console.log("=".repeat(80));

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing environment variables:");
        console.error("   SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
        console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Connected to Supabase\n");

    // Fetch submissions in date range
    console.log("🔍 Querying submissions...");
    const { data: submissions, error: queryError } = await supabase
        .from("audition_submissions")
        .select("*")
        .gte("submitted_at", START_DATE)
        .lte("submitted_at", END_DATE)
        .in("status", ["completed", "pending_review", "started"])
        .order("submitted_at", { ascending: true });

    if (queryError) {
        console.error("❌ Error querying submissions:", queryError);
        process.exit(1);
    }

    if (!submissions || submissions.length === 0) {
        console.log("ℹ️  No submissions found in the specified date range");
        process.exit(0);
    }

    console.log(`✅ Found ${submissions.length} submissions to process\n`);

    // Process each submission
    const results = [];

    for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        console.log(`\n[${i + 1}/${submissions.length}] ${"=".repeat(70)}`);

        const result = await processSubmission(supabase, submission);
        results.push(result);

        // Small delay between submissions to avoid rate limiting
        if (i < submissions.length - 1) {
            await sleep(1000);
        }
    }

    // Print Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 BACKFILL SUMMARY");
    console.log("=".repeat(80));

    const successful = results.filter(r => r.status === "success");
    const failed = results.filter(r => r.status === "failed");
    const skipped = results.filter(r => r.status === "skipped");

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⏭️  Skipped: ${skipped.length}`);
    console.log(`📝 Total: ${results.length}`);

    if (successful.length > 0) {
        console.log("\n✅ Successfully synced submissions:");
        successful.forEach(r => {
            console.log(`   - ${r.submission_id} (Project: ${r.project_id})`);
        });
    }

    if (failed.length > 0) {
        console.log("\n❌ Failed submissions:");
        failed.forEach(r => {
            console.log(`   - ${r.submission_id}: ${r.error}`);
        });
    }

    if (skipped.length > 0) {
        console.log("\n⏭️  Skipped submissions:");
        skipped.forEach(r => {
            console.log(`   - ${r.submission_id}: ${r.error}`);
        });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✨ Backfill complete!");
    console.log("=".repeat(80));
}

// Run the script
main().catch(error => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
});
