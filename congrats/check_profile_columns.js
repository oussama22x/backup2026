import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uvszvjbzcvkgktrvavqe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3ODA0NiwiZXhwIjoyMDc3MzU0MDQ2fQ.ZJRbe7DvAfwkJHOsc9aaKb4-KjkXMKB6kzA8WBOx1J0'
);

async function checkProfileColumns() {
  const { data, error } = await supabase
    .from('talent_profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
  } else if (data && data[0]) {
    const columns = Object.keys(data[0]);
    console.log('\n=== talent_profiles columns ===');
    console.log(columns.join('\n'));
    
    console.log('\n=== Checking resume field ===');
    console.log('resume_url:', columns.includes('resume_url') ? '✅ EXISTS' : '❌ MISSING');
    console.log('resume_path:', columns.includes('resume_path') ? '✅ EXISTS' : '❌ MISSING');
  } else {
    console.log('No data found in talent_profiles');
  }
}

checkProfileColumns();
