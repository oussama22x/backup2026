
async function compareEndpoints() {
    const backendUrl = 'http://localhost:4000';

    console.log('--- Fetching /api/vetted/jobs ---');
    try {
        const jobsRes = await fetch(`${backendUrl}/api/vetted/jobs`);
        const jobs = await jobsRes.json();
        console.log(`Jobs count: ${jobs.length}`);
        if (jobs.length > 0) {
            console.log('Sample Job Keys:', Object.keys(jobs[0]));
            console.log('Sample Job:', JSON.stringify(jobs[0], null, 2));
        }
    } catch (e) {
        console.error('Error fetching jobs:', e.message);
    }

    console.log('\n--- Fetching /api/vetted/role-definitions ---');
    try {
        const rolesRes = await fetch(`${backendUrl}/api/vetted/role-definitions`);
        const roles = await rolesRes.json();
        console.log(`Role Definitions count: ${roles.length}`);
        if (roles.length > 0) {
            console.log('Sample Role Def Keys:', Object.keys(roles[0]));
            console.log('Sample Role Def:', JSON.stringify(roles[0], null, 2));
        }
    } catch (e) {
        console.error('Error fetching role definitions:', e.message);
    }
}

compareEndpoints();
