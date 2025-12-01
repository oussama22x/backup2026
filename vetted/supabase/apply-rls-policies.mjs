import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lagvszfwsruniuinxdjb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3Zzemmd3NydW5pdWlueGRqYiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3Mjg1OTU5OTYsImV4cCI6MjA0NDE3MTk5Nn0.i59D7LPuCaZYLHaePcnFJr_ZxdRfJ7V3FCiF-63bNNJAtrnwuAHzpRF45ipcwSdvAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyRLSPolicies() {
  console.log('Applying RLS policies to recruiters table...');

  const policies = [
    {
      name: 'Users can insert own recruiter profile',
      sql: `
        create policy "Users can insert own recruiter profile"
        on public.recruiters
        for insert
        to authenticated
        with check (user_id = auth.uid());
      `
    },
    {
      name: 'Users can view own recruiter profile',
      sql: `
        create policy "Users can view own recruiter profile"
        on public.recruiters
        for select
        to authenticated
        using (user_id = auth.uid());
      `
    },
    {
      name: 'Users can update own recruiter profile',
      sql: `
        create policy "Users can update own recruiter profile"
        on public.recruiters
        for update
        to authenticated
        using (user_id = auth.uid());
      `
    },
    {
      name: 'Admins can view all recruiter profiles',
      sql: `
        create policy "Admins can view all recruiter profiles"
        on public.recruiters
        for select
        to authenticated
        using (public.is_admin());
      `
    },
    {
      name: 'Admins can update all recruiter profiles',
      sql: `
        create policy "Admins can update all recruiter profiles"
        on public.recruiters
        for update
        to authenticated
        using (public.is_admin());
      `
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`Applying policy: ${policy.name}`);
      const { data, error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      
      if (error) {
        console.error(`Error applying policy "${policy.name}":`, error.message);
      } else {
        console.log(`✓ Policy "${policy.name}" applied successfully`);
      }
    } catch (err) {
      console.error(`Exception applying policy "${policy.name}":`, err.message);
    }
  }

  console.log('\nAll policies applied!');
}

applyRLSPolicies();
