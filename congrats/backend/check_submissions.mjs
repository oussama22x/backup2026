import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubmissions() {
  console.log('Checking audition_submissions table...\n');
  
  const { data, error } = await supabase
    .from('audition_submissions')
    .select('id, user_id, opportunity_id, status, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('❌ No audition submissions found in database');
    console.log('\nTo see candidates in Vetted:');
    console.log('1. Open Congrats app (http://localhost:5174)');
    console.log('2. Sign up / Log in');
    console.log('3. Browse opportunities and complete an audition');
    console.log('4. Return to Vetted and refresh the project page');
  } else {
    console.log(`✅ Found ${data.length} submissions:\n`);
    data.forEach((sub, idx) => {
      console.log(`${idx + 1}. Submission ID: ${sub.id}`);
      console.log(`   User ID: ${sub.user_id}`);
      console.log(`   Opportunity ID: ${sub.opportunity_id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Submitted: ${sub.submitted_at}`);
      console.log('');
    });
    
    console.log('\n🔍 To test in Vetted, use these opportunity IDs:');
    const uniqueOpportunities = [...new Set(data.map(s => s.opportunity_id))];
    uniqueOpportunities.forEach(id => console.log(`   ${id}`));
  }
}

checkSubmissions();
