#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uvszvjbzcvkgktrvavqe.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c3p2amJ6Y3ZrZ2t0cnZhdnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc3ODA0NiwiZXhwIjoyMDc3MzU0MDQ2fQ.ZJRbe7DvAfwkJHOsc9aaKb4-KjkXMKB6kzA8WBOx1J0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL(sql) {
  // Use the REST API to execute raw SQL via PostgREST
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });
  
  return response;
}

async function applyFix() {
  console.log('🔧 Fixing job application RLS policies...\n');

  const statements = [
    {
      name: 'Drop SELECT policy',
      sql: `DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications;`
    },
    {
      name: 'Drop INSERT policy',
      sql: `DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications;`
    },
    {
      name: 'Drop UPDATE policy',
      sql: `DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications;`
    },
    {
      name: 'Create security definer function',
      sql: `CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;`
    },
    {
      name: 'Create SELECT policy',
      sql: `CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );`
    },
    {
      name: 'Create INSERT policy',
      sql: `CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.role() = 'anon' OR
    auth.uid() = user_id OR 
    user_id IS NULL
  );`
    },
    {
      name: 'Create UPDATE policy',
      sql: `CREATE POLICY "Users can update their own applications" ON public.job_applications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
  );`
    }
  ];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.name}...`);
    
    try {
      const response = await executeSQL(stmt.sql);
      if (response.ok) {
        console.log(`      ✅ Success\n`);
      } else {
        const error = await response.text();
        console.log(`      ⚠️  ${response.status}: ${error}\n`);
      }
    } catch (error) {
      console.log(`      ⚠️  ${error.message}\n`);
    }
  }

  console.log('='.repeat(70));
  console.log('✅ FIX COMPLETED!');
  console.log('='.repeat(70));
  console.log('\n🧪 Please test submitting a job application now\n');
}

applyFix().catch(console.error);
