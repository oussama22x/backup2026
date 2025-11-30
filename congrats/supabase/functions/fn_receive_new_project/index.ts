import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
        const payload = await req.json();
        console.log("📦 Received Payload:", JSON.stringify(payload, null, 2));

        // 1. Validate Payload
        const { project_id, project_title, recruiter_email, recruiter_name } = payload;

        if (!project_id || !recruiter_email) {
            throw new Error("Missing required fields: project_id or recruiter_email");
        }

        // 2. Generate Audition Link
        const auditionUrl = `https://talent.vettedai.app/audition/${project_id}`;
        console.log(`🔗 Generated Link: ${auditionUrl}`);

        // 3. Send Email (Placeholder)
        // TODO: Integrate with Resend, SendGrid, or Supabase Auth Emails
        console.log(`📧 MOCK EMAIL SENDING...`);
        console.log(`   To: ${recruiter_email}`);
        console.log(`   Subject: Your Audition Link for ${project_title || 'New Project'} is Ready`);
        console.log(`   Body: Hello ${recruiter_name || 'Recruiter'}, here is your public audition link: ${auditionUrl}`);

        // Simulate success
        const emailSent = true;

        return new Response(JSON.stringify({
            success: true,
            message: "Project received and link generated",
            data: {
                project_id,
                audition_url: auditionUrl,
                email_sent: emailSent
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("❌ Error processing new project:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
