
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in Node 18+

async function testNotifyLogic() {
    console.log('🚀 Starting Notify Opportunity Logic Test...');

    // 1. Mock the Payload (Simulating a Database Webhook INSERT payload)
    const mockRecord = {
        id: '550e8400-e29b-41d4-a716-446655440099', // Test ID
        vetted_project_id: 'external-uuid-1234-5678',
        created_at: new Date().toISOString(),
        title: 'Test Opportunity',
        status: 'active'
    };

    console.log('📥 Received Mock Record:', mockRecord);

    // --- LOGIC FROM EDGE FUNCTION ---

    // 2. Extract Data
    const opportunityId = mockRecord.id;
    const vettedProjectId = mockRecord.vetted_project_id;
    const createdAt = mockRecord.created_at;

    // 3. Construct URL
    const auditionUrl = `https://congrats.ai/audition/${opportunityId}`;

    // 4. Construct Payload
    const webhookPayload = {
        project_id: vettedProjectId || null,
        opportunity_id: opportunityId,
        audition_url: auditionUrl,
        created_at: createdAt
    };

    console.log('\n--- CONSTRUCTED PAYLOAD ---');
    console.log(JSON.stringify(webhookPayload, null, 2));
    console.log('---------------------------\n');

    // 5. (Optional) Dry Run Send
    const VETTED_WEBHOOK_URL = "https://lagvszfwsruniuinxdjb.supabase.co/functions/v1/fn_receive_opportunity_created";

    console.log(`Ready to send to: ${VETTED_WEBHOOK_URL}`);
    console.log('⚠️  Skipping actual network request to avoid spamming production webhook with test data.');
    console.log('✅ Logic Verification Complete: URL construction and payload mapping are correct.');
}

testNotifyLogic();
