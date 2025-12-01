#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

// Direct PostgreSQL connection - more reliable than REST API
const connectionString = 'postgresql://postgres.uvszvjbzcvkgktrvavqe:Youcef@1996@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyFix() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('🔧 Applying RLS fixes...\n');

    // Drop existing policies
    console.log('[1/7] Dropping old policies...');
    await client.query(`DROP POLICY IF EXISTS "Users can view their own applications" ON public.job_applications`);
    await client.query(`DROP POLICY IF EXISTS "Users can create applications" ON public.job_applications`);
    await client.query(`DROP POLICY IF EXISTS "Users can update their own applications" ON public.job_applications`);
    console.log('      ✅ Old policies dropped\n');

    // Create security definer function
    console.log('[2/7] Creating security definer function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_current_user_email()
      RETURNS TEXT
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT email FROM auth.users WHERE id = auth.uid();
      $$;
    `);
    console.log('      ✅ Function created\n');

    // Create SELECT policy
    console.log('[3/7] Creating SELECT policy...');
    await client.query(`
      CREATE POLICY "Users can view their own applications" ON public.job_applications
        FOR SELECT USING (
          auth.uid() = user_id OR 
          (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
        )
    `);
    console.log('      ✅ SELECT policy created\n');

    // Create INSERT policy
    console.log('[4/7] Creating INSERT policy...');
    await client.query(`
      CREATE POLICY "Users can create applications" ON public.job_applications
        FOR INSERT WITH CHECK (
          auth.role() = 'anon' OR
          auth.uid() = user_id OR 
          user_id IS NULL
        )
    `);
    console.log('      ✅ INSERT policy created\n');

    // Create UPDATE policy
    console.log('[5/7] Creating UPDATE policy...');
    await client.query(`
      CREATE POLICY "Users can update their own applications" ON public.job_applications
        FOR UPDATE USING (
          auth.uid() = user_id OR 
          (auth.uid() IS NOT NULL AND (candidate_data->>'email') = public.get_current_user_email())
        )
    `);
    console.log('      ✅ UPDATE policy created\n');

    console.log('=' .repeat(70));
    console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📝 What was fixed:');
    console.log('  • Created security definer function: get_current_user_email()');
    console.log('  • Recreated RLS policies without direct auth.users access');
    console.log('  • Anonymous users can now submit applications\n');
    console.log('🧪 Test now: Try submitting a job application');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 If connection fails, manually run FIX_JOB_APPLICATION_RLS.sql');
    console.log('   in Supabase SQL Editor');
  } finally {
    await client.end();
  }
}

applyFix();
