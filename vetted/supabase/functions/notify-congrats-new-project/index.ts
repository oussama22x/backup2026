import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Vetted Edge Function: Notify Congrats on New Project
 * 
 * This function is triggered by a database webhook when a new project is created.
 * It fetches recruiter details and sends them to Congrats to generate an audition URL.
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Parse webhook payload from Supabase
        const payload = await req.json();
        console.log("📦 Webhook Payload:", JSON.stringify(payload, null, 2));

        // Supabase webhook format: { type: 'INSERT', table: 'projects', record: {...} }
        const webhookRecord = payload.record || payload;

        if (!webhookRecord || !webhookRecord.id) {
            throw new Error("Invalid webhook payload - missing project data");
        }

        const projectId = webhookRecord.id;
        console.log(`🔍 Processing project: ${projectId}`);

        // 2. Initialize Supabase client (Vetted database)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2.5. Fetch full project details (in case webhook only sent ID)
        console.log(`📋 Fetching full project details...`);
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, recruiter_id, role_title")
            .eq("id", projectId)
            .single();

        if (projectError || !project) {
            throw new Error(`Failed to fetch project: ${projectError?.message || 'Not found'}`);
        }

        const recruiterId = project.recruiter_id;
        const roleTitle = project.role_title || "Untitled Project";

        console.log(`   Recruiter ID: ${recruiterId}`);
        console.log(`   Role: ${roleTitle}`);

        // 3. Fetch recruiter details
        console.log(`👤 Fetching recruiter details...`);
        
        const { data: recruiter, error: recruiterError } = await supabase
            .from("recruiters")
            .select("email, full_name")
            .eq("id", recruiterId)
            .single();

        if (recruiterError) {
            console.error("❌ Error fetching recruiter:", recruiterError);
            throw new Error(`Failed to fetch recruiter: ${recruiterError.message}`);
        }

        if (!recruiter || !recruiter.email) {
            console.warn("⚠️ Recruiter not found or missing email");
            throw new Error("Recruiter email not found");
        }

        console.log(`✅ Found recruiter: ${recruiter.email}`);

        // 4. Send to Congrats webhook
        const congratsWebhookUrl = "https://uvszvjbzcvkgktrvavqe.supabase.co/functions/v1/fn_receive_new_project";
        
        const congratsPayload = {
            project_id: projectId,
            project_title: roleTitle,
            recruiter_email: recruiter.email,
            recruiter_name: recruiter.full_name || null
        };

        console.log("🚀 Sending to Congrats:", JSON.stringify(congratsPayload, null, 2));

        const response = await fetch(congratsWebhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(congratsPayload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error("❌ Congrats webhook failed:", responseData);
            throw new Error(`Congrats webhook error: ${JSON.stringify(responseData)}`);
        }

        console.log("✅ Congrats response:", responseData);

        // 5. Optionally: Update project with audition URL
        if (responseData.data?.audition_url) {
            console.log(`🔗 Audition URL: ${responseData.data.audition_url}`);
            
            // You can store this back in Vetted if needed:
            // await supabase
            //     .from("projects")
            //     .update({ audition_url: responseData.data.audition_url })
            //     .eq("id", projectId);
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Project synced to Congrats successfully",
            audition_url: responseData.data?.audition_url
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("💥 Error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
