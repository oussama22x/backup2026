import { config } from "https://deno.land/std@0.168.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Load environment variables from backend/.env
await config({ path: "backend/.env", export: true });

// Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VETTED_WEBHOOK_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_opportunity_created";
const WEBHOOK_SECRET = "81e204785103a6551d4c703da4d7f0dddb4f80656bae923e091568f47b1f18d0";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function backfillOpportunities() {
    console.log("🚀 Starting Opportunity Backfill...");

    // 1. Query Data
    const { data: opportunities, error } = await supabase
        .from("opportunities")
        .select("id, vetted_project_id, created_at")
        .not("vetted_project_id", "is", null);

    if (error) {
        console.error("❌ Error fetching opportunities:", error.message);
        Deno.exit(1);
    }

    console.log(`found ${opportunities.length} opportunities to sync.`);

    let successCount = 0;
    let failureCount = 0;

    // 2. Loop & Send
    for (const record of opportunities) {
        const opportunityId = record.id;
        const vettedProjectId = record.vetted_project_id;
        const createdAt = record.created_at;
        const auditionUrl = `https://talent.vettedai.app/audition/${opportunityId}`;

        const payload = {
            project_id: vettedProjectId,
            opportunity_id: opportunityId,
            audition_url: auditionUrl,
            created_at: createdAt,
        };

        console.log(`Processing ${opportunityId} -> Vetted Project ${vettedProjectId}`);
        console.log("Payload:", JSON.stringify(payload, null, 2));

        try {
            await sendToVetted(payload);
            console.log(`✅ Success: ${opportunityId}`);
            successCount++;
        } catch (err) {
            console.error(`❌ Failed: ${opportunityId} - ${err.message}`);
            failureCount++;
        }

        // Small delay to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n--- Backfill Complete ---");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
}

// 3. Send POST Request with Retry
async function sendToVetted(data: any, attempt = 1): Promise<any> {
    const maxRetries = 5;
    const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 60000);

    try {
        const response = await fetch(VETTED_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-webhook-secret": WEBHOOK_SECRET,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status >= 500 && attempt < maxRetries) {
                console.warn(`   Server error ${response.status}. Retrying in ${backoff}ms...`);
                await new Promise((resolve) => setTimeout(resolve, backoff));
                return sendToVetted(data, attempt + 1);
            }
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        if (attempt < maxRetries) {
            console.warn(`   Network error: ${error.message}. Retrying in ${backoff}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            return sendToVetted(data, attempt + 1);
        }
        throw error;
    }
}

// Run the script
backfillOpportunities();
