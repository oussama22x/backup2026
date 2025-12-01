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
        const payload = await req.json();
        console.log("📦 Received Payload:", JSON.stringify(payload, null, 2));

        // 1. Validate Payload
        const { project_id, project_title, recruiter_email, recruiter_name } = payload;

        if (!project_id || !recruiter_email) {
            throw new Error("Missing required fields: project_id or recruiter_email");
        }

        // 2. Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Generate Audition Link
        const auditionUrl = `https://talent.vettedai.app/audition/${project_id}/start`;
        console.log(`🔗 Generated Audition Link: ${auditionUrl}`);

        // 4. Insert into vetted_projects table
        console.log(`💾 Saving project to database: ${project_id}`);

        const { data: project, error: insertError } = await supabase
            .from("vetted_projects")
            .upsert({
                vetted_project_id: project_id,
                project_title: project_title || "Untitled Project",
                recruiter_email: recruiter_email,
                recruiter_name: recruiter_name || null,
                audition_url: auditionUrl,
                status: "active",
                created_at: new Date().toISOString()
            }, { onConflict: "vetted_project_id" })
            .select()
            .single();

        if (insertError) {
            console.error("❌ Database Insert Error:", insertError);
            throw new Error(`Failed to save project: ${insertError.message}`);
        }

        console.log(`✅ Project saved: ${project.id}`);

        // 5. Send Email (Placeholder)
        // TODO: Integrate with Resend, SendGrid, or Supabase Auth Emails
        console.log(`📧 MOCK EMAIL SENDING...`);
        console.log(`   To: ${recruiter_email}`);
        console.log(`   Subject: Your Audition Link for ${project_title || 'New Project'} is Ready`);
        console.log(`   Body: Hello ${recruiter_name || 'Recruiter'}, here is your public audition link: ${auditionUrl}`);

        // Simulate success
        const emailSent = true;

        return new Response(JSON.stringify({
            success: true,
            message: "Project received, saved to DB, and link generated",
            data: {
                project_id,
                audition_url: auditionUrl,
                email_sent: emailSent,
                db_record: project.id,
                recruiter_email: recruiter_email
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("❌ Error processing new project:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
