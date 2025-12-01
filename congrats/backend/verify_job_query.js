
const fetch = require('node-fetch');

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

async function verifyJobs() {
    console.log(`Testing endpoint: ${BASE_URL}/api/vetted/jobs`);

    try {
        const response = await fetch(`${BASE_URL}/api/vetted/jobs`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jobs = await response.json();
        console.log(`Received ${jobs.length} jobs.`);

        const excludedStatuses = ['draft', 'pending_activation', 'awaiting_setup_call'];
        let violations = 0;

        jobs.forEach(job => {
            if (excludedStatuses.includes(job.status)) {
                console.error(`❌ VIOLATION: Job ${job.id} has status '${job.status}'`);
                violations++;
            }
        });

        if (violations === 0) {
            console.log('✅ SUCCESS: No jobs with excluded statuses found.');
        } else {
            console.error(`❌ FAILURE: Found ${violations} jobs with excluded statuses.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error testing endpoint:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Is the server running?');
        }
        process.exit(1);
    }
}

verifyJobs();
