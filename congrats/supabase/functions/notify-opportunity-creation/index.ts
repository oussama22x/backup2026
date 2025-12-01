
// DB HOOK INSTRUCTION
// Run this SQL in your Supabase SQL Editor to create the trigger:
//
// create trigger "notify_opportunity_created"
// after insert on "opportunities"
// for each row
// execute function supabase_functions.http_request(
//   'https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/notify-opportunity-creation',
//   'POST',
//   '{"Content-Type":"application/json"}',
//   '{}',
//   '1000'
// );
//
// NOTE: The above is a generic http_request trigger. 
// A better approach for Edge Functions is using the UI or the "supabase_functions.http_request" is often custom.
//
// STANDARD WEBHOOK TRIGGER (Recommended):
// 1. Go to Database > Webhooks in Supabase Dashboard.
// 2. Create a new webhook.
// 3. Name: notify-opportunity-creation
// 4. Table: opportunities
// 5. Events: INSERT
// 6. Type: HTTP Request
// 7. URL: https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/notify-opportunity-creation
// 8. HTTP Method: POST
// 9. HTTP Headers: Authorization: Bearer <YOUR_SERVICE_ROLE_KEY> (Optional, but good for security)

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

        // Database Webhook payload structure: { type: 'INSERT', table: 'opportunities', record: { ... }, schema: 'public', old_record: null }
        // Or direct invocation payload if manually triggered
        const record = payload.record || payload;

        if (!record || !record.id) {
            throw new Error("Missing record or record.id in payload");
        }

        console.log(`Processing new opportunity: ${record.id}`);

        // 1. Extract Data
        const opportunityId = record.id;
        const vettedProjectId = record.vetted_project_id;
        const createdAt = record.created_at || new Date().toISOString();

        // 2. Construct URL
        // Assuming we use ID for the URL as per requirement: https://talent.vettedai.app/audition/${record.id}
        const auditionUrl = `https://talent.vettedai.app/audition/${opportunityId}/start`;

        // 3. Construct Payload
        const webhookPayload = {
            project_id: vettedProjectId || null, // External Vetted Project UUID
            opportunity_id: opportunityId,       // Our internal ID
            audition_url: auditionUrl,
            created_at: createdAt
        };

        console.log("Constructed Payload:", JSON.stringify(webhookPayload, null, 2));

        // 4. Send to VettedAI with Retry Logic
        const VETTED_WEBHOOK_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_opportunity_created";
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

        const responseData = await sendToVetted(webhookPayload);

        return new Response(JSON.stringify({ success: true, data: responseData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error processing opportunity creation:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
