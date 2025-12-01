
// Mock data
const mockSubmission = { user_id: 'user-123' };
const mockUserWithNoName = { email: 'test@example.com', user_metadata: {} };
const mockProfile = { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' };

// Logic from Edge Function (Updated)
async function getName(user, profile) {
    let email = "unknown@example.com";
    let name = "Unknown Candidate";

    if (user) {
        email = user.email || email;
        name = user.user_metadata?.full_name || name;
    }

    // If name is still unknown, try fetching from talent_profiles
    if (name === "Unknown Candidate") {
        if (profile) {
            name = `${profile.first_name} ${profile.last_name}`;
            // Only update email if it was unknown
            if (email === "unknown@example.com") {
                email = profile.email || email;
            }
        }
    }

    return { name, email };
}

console.log('--- Verifying Name Retrieval Logic ---');

(async () => {
    const result = await getName(mockUserWithNoName, mockProfile);
    console.log(`Result Name: ${result.name}`);
    console.log(`Result Email: ${result.email}`);

    if (result.name === 'John Doe') {
        console.log('✅ SUCCESS: Name retrieved from profile fallback!');
    } else {
        console.log('❌ FAILURE: Name fallback failed.');
        process.exit(1);
    }
})();
