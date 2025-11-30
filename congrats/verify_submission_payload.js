
// Test script to verify the Vetted submission payload
// This script simulates the logic of the Edge Function to confirm the payload structure

const mockSubmission = {
    id: 'sub-123',
    user_id: 'user-456',
    opportunity_id: 'opp-789',
    questions: ['Q1', 'Q2'],
    audio_urls: ['url1', 'url2']
};

const mockUser = {
    email: 'test@example.com',
    user_metadata: { full_name: 'Test Candidate' }
};

const mockOpportunity = {
    vetted_project_id: 'proj-abc'
};

const mockAnswers = [
    {
        question_id: 'q1',
        question_text: 'Tell us about yourself',
        audio_url: 'https://example.com/audio1.mp3',
        transcript: 'I am a developer.',
        submitted_at: new Date().toISOString()
    }
];

// Logic from Edge Function
function constructPayload(submission, user, opportunity, answers) {
    const projectId = opportunity.vetted_project_id || submission.opportunity_id;

    return {
        submission_id: submission.id,
        project_id: projectId,
        email: user.email,
        name: user.user_metadata.full_name,
        answers: answers.map(ans => ({
            question_id: ans.question_id,
            question_text: ans.question_text,
            transcript: ans.transcript,
            audio_url: ans.audio_url,
            submitted_at: ans.submitted_at
        }))
    };
}

console.log('--- Verifying Vetted Submission Payload ---');

const payload = constructPayload(mockSubmission, mockUser, mockOpportunity, mockAnswers);

console.log('Generated Payload:');
console.log(JSON.stringify(payload, null, 2));

// Verification
const requiredFields = ['submission_id', 'project_id', 'email', 'answers'];
const missingFields = requiredFields.filter(field => !payload[field]);

if (missingFields.length === 0) {
    console.log('✅ SUCCESS: Payload contains all required fields.');
} else {
    console.log(`❌ FAILURE: Missing fields: ${missingFields.join(', ')}`);
    process.exit(1);
}
