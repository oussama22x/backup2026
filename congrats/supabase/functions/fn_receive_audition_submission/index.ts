
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { submission_id } = await req.json();

        if (!submission_id) {
            throw new Error("Missing submission_id");
        }

        console.log(`Processing submission: ${submission_id}`);

        // 1. Fetch Submission & Related Data
        const { data: submission, error: submissionError } = await supabaseClient
            .from("audition_submissions")
            .select("*, user_id, opportunity_id")
            .eq("id", submission_id)
            .single();

        if (submissionError) throw new Error(`Error fetching submission: ${submissionError.message}`);

        // 2. Fetch Opportunity (for Vetted Project ID)
        const { data: opportunity, error: opportunityError } = await supabaseClient
            .from("opportunities")
            .select("vetted_project_id")
            .eq("id", submission.opportunity_id)
            .single();

        if (opportunityError) throw new Error(`Error fetching opportunity: ${opportunityError.message}`);

        // 3. Fetch User (for Email)
        const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(submission.user_id);
        if (userError) console.error(`Error fetching user auth data: ${userError.message}`);

        // 4. Fetch Profile (for Candidate Details)
        const { data: profile, error: profileError } = await supabaseClient
            .from("talent_profiles")
            .select("*")
            .eq("user_id", submission.user_id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error(`Error fetching profile: ${profileError.message}`);
        }

        // 5. Fetch Answers
        const { data: answers, error: answersError } = await supabaseClient
            .from("audition_answers")
            .select("*")
            .eq("user_id", submission.user_id)
            .eq("opportunity_id", submission.opportunity_id);

        if (answersError) throw new Error(`Error fetching answers: ${answersError.message}`);

        // 6. Process Answers & Generate Signed URLs
        const processedAnswers = await Promise.all(
            (answers || []).map(async (answer) => {
                let audioUrl = answer.audio_url;

                // Generate Signed URL if we have a path
                if (answer.audio_path) {
                    const { data: signedData, error: signedError } = await supabaseClient
                        .storage
                        .from("audition-recordings")
                        .createSignedUrl(answer.audio_path, 31536000); // 1 year in seconds

                    if (!signedError && signedData) {
                        audioUrl = signedData.signedUrl;
                    } else {
                        console.error(`Failed to sign URL for ${answer.audio_path}:`, signedError);
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
            project_id: opportunity?.vetted_project_id || null, // External Vetted Project UUID
            email: user?.email || profile?.email || "",
            name: profile?.full_name || "",
            profile: {
                experience_level: profile?.years_experience || null, // Mapping years_experience to experience_level
                desired_salary_min: null, // Not in schema
                desired_salary_max: null, // Not in schema
                availability_date: null, // Not in schema
                start_timing: null, // Not in schema
                work_arrangements: [], // Not in schema
                location_preferences: [], // Not in schema
                current_city: profile?.location || null, // Mapping location to current_city
                current_country: null, // Not in schema
                desired_roles: [], // Not in schema
                linkedin_url: profile?.linkedin_url || null,
                github_url: null, // Not in schema
                portfolio_url: profile?.portfolio_url || null,
                bio: profile?.bio || null,
            },
            answers: processedAnswers,
        };

        console.log("Constructed Payload:", JSON.stringify(payload, null, 2));

        // 8. Send to VettedAI with Retry Logic
        const VETTED_WEBHOOK_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_audition_submission";
        const WEBHOOK_SECRET = "81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0";

        const sendToVetted = async (data: any, attempt = 1): Promise<any> => {
            const maxRetries = 5;
            const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 60000); // Start 1s, double, max 60s

            try {
                console.log(`Sending to VettedAI (Attempt ${attempt}/${maxRetries})...`);
                const response = await fetch(VETTED_WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-webhook-secret": WEBHOOK_SECRET,
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    // Retry only on 5xx errors
                    if (response.status >= 500 && attempt < maxRetries) {
                        console.warn(`Server error ${response.status}. Retrying in ${backoff}ms...`);
                        await new Promise((resolve) => setTimeout(resolve, backoff));
                        return sendToVetted(data, attempt + 1);
                    }

                    // Do NOT retry on 4xx errors
                    const errorText = await response.text();
                    throw new Error(`VettedAI API Error (${response.status}): ${errorText}`);
                }

                return await response.json();
            } catch (error) {
                if (attempt < maxRetries) {
                    console.warn(`Network error: ${error.message}. Retrying in ${backoff}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                    return sendToVetted(data, attempt + 1);
                }
                throw error;
            }
        };

        const responseData = await sendToVetted(payload);

        return new Response(JSON.stringify({ success: true, data: responseData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error processing audition submission:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
