const fetch = require('node-fetch');

const SUPABASE_URL = 'https://lagvszfwsruniuinxdjb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3Zzemmd3NydW5pdWlueGRqYiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3Mjg1OTU5OTYsImV4cCI6MjA0NDE3MTk5Nn0.i59D7LPuCaZYLHaePcnFJr_ZxdRfJ7V3FCiF-63bNNJAtrnwuAHzpRF45ipcwSdvAU';

const sql = `
-- Allow authenticated users to insert their own recruiter profile during signup
create policy "Users can insert own recruiter profile"
on public.recruiters
for insert
to authenticated
with check (user_id = auth.uid());

-- Allow authenticated users to view their own recruiter profile
create policy "Users can view own recruiter profile"
on public.recruiters
for select
to authenticated
using (user_id = auth.uid());

-- Allow authenticated users to update their own recruiter profile
create policy "Users can update own recruiter profile"
on public.recruiters
for update
to authenticated
using (user_id = auth.uid());

-- Allow admins to view all recruiter profiles
create policy "Admins can view all recruiter profiles"
on public.recruiters
for select
to authenticated
using (public.is_admin());

-- Allow admins to update all recruiter profiles
create policy "Admins can update all recruiter profiles"
on public.recruiters
for update
to authenticated
using (public.is_admin());
`;

async function applyMigration() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.error('Failed to apply migration:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      process.exit(1);
    }

    const result = await response.json();
    console.log('Migration applied successfully!');
    console.log(result);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
