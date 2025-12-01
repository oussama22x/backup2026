import { createClient } from '@supabase/supabase-js';

const supabaseVetted = createClient(
  'https://lagvszfwsruniuinxdjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3ZzemZ3c3J1bml1aW54ZGpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg2MDQ4MywiZXhwIjoyMDc4NDM2NDgzfQ.ZxdRfJ7V3FCiF-63bNNJAtrnwuAHzpRF45ipcwSdvAU'
);

async function checkRecruiterData() {
  console.log('\n=== Checking Projects with Recruiter Relationships ===\n');

  // Check 1: All projects (without filter)
  const { data: allProjects, error: allError } = await supabaseVetted
    .from('projects')
    .select('id, role_title, company_name, recruiter_id, status')
    .not('status', 'in', '("draft","pending_activation","awaiting_setup_call")')
    .limit(10);

  if (allError) {
    console.error('❌ Error fetching all projects:', allError);
  } else {
    console.log(`\n✅ Found ${allProjects.length} projects (no recruiter filter):`);
    allProjects.forEach(p => {
      console.log(`  - ${p.role_title} @ ${p.company_name} | recruiter_id: ${p.recruiter_id || 'NULL'}`);
    });
  }

  // Check 2: Projects with paid recruiter filter (like /api/vetted/jobs)
  const { data: paidProjects, error: paidError } = await supabaseVetted
    .from('projects')
    .select(`
      id,
      role_title,
      company_name,
      recruiter_id,
      status,
      recruiters!inner (
        id,
        is_paid_account
      )
    `)
    .not('status', 'in', '("draft","pending_activation","awaiting_setup_call")')
    .eq('recruiters.is_paid_account', true)
    .limit(10);

  if (paidError) {
    console.error('\n❌ Error fetching paid projects:', paidError);
  } else {
    console.log(`\n✅ Found ${paidProjects.length} projects with PAID recruiters:`);
    paidProjects.forEach(p => {
      console.log(`  - ${p.role_title} @ ${p.company_name} | recruiter: ${p.recruiters?.id} (paid: ${p.recruiters?.is_paid_account})`);
    });
  }

  // Check 3: Projects LEFT JOIN recruiters
  const { data: leftJoinProjects, error: leftError } = await supabaseVetted
    .from('projects')
    .select(`
      id,
      role_title,
      company_name,
      recruiter_id,
      recruiters (
        id,
        is_paid_account
      )
    `)
    .not('status', 'in', '("draft","pending_activation","awaiting_setup_call")')
    .limit(10);

  if (leftError) {
    console.error('\n❌ Error with LEFT JOIN:', leftError);
  } else {
    console.log(`\n✅ Found ${leftJoinProjects.length} projects (LEFT JOIN recruiters):`);
    leftJoinProjects.forEach(p => {
      const hasRecruiter = p.recruiters ? '✓' : '✗';
      const isPaid = p.recruiters?.is_paid_account ? 'PAID' : 'FREE';
      console.log(`  ${hasRecruiter} ${p.role_title} @ ${p.company_name} | ${p.recruiters ? isPaid : 'NO RECRUITER'}`);
    });
  }

  console.log('\n=== Analysis ===');
  const withoutRecruiter = leftJoinProjects.filter(p => !p.recruiters).length;
  const withFreeRecruiter = leftJoinProjects.filter(p => p.recruiters && !p.recruiters.is_paid_account).length;
  const withPaidRecruiter = leftJoinProjects.filter(p => p.recruiters && p.recruiters.is_paid_account).length;

  console.log(`Total projects: ${leftJoinProjects.length}`);
  console.log(`- Without recruiter: ${withoutRecruiter}`);
  console.log(`- With FREE recruiter: ${withFreeRecruiter}`);
  console.log(`- With PAID recruiter: ${withPaidRecruiter}`);
  console.log(`\n⚠️  /api/vetted/jobs only returns ${withPaidRecruiter} jobs (filters out ${withoutRecruiter + withFreeRecruiter})`);
  console.log(`✅  /api/opportunities returns all ${leftJoinProjects.length} jobs\n`);
}

checkRecruiterData().catch(console.error);
