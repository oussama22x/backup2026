#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillAppUsers() {
  console.log('📋 Running backfill migration...\n');
  
  // First, show current state
  const { data: beforeAuth } = await supabase.auth.admin.listUsers();
  const { data: beforeAppUser } = await supabase.from('app_user').select('id, email');
  
  console.log('BEFORE MIGRATION:');
  console.log('  auth.users:', beforeAuth.users.length);
  console.log('  app_user:', beforeAppUser?.length || 0);
  console.log('');
  
  // Insert users that don't have app_user records
  const usersToInsert = [];
  for (const user of beforeAuth.users) {
    const exists = beforeAppUser?.find(u => u.id === user.id);
    if (!exists && user.email) {
      usersToInsert.push({
        id: user.id,
        email: user.email,
        role: 'TALENT'
      });
    }
  }
  
  if (usersToInsert.length > 0) {
    console.log(`📝 Inserting ${usersToInsert.length} users into app_user...`);
    const { error: insertError } = await supabase.from('app_user').insert(usersToInsert);
    if (insertError) {
      console.error('❌ Error:', insertError);
      process.exit(1);
    }
    console.log(`✅ Inserted ${usersToInsert.length} users into app_user\n`);
  } else {
    console.log('✅ No users to backfill\n');
  }
  
  // Show after state
  const { data: afterAppUser } = await supabase.from('app_user').select('id, email, role');
  console.log('AFTER MIGRATION:');
  console.log('  app_user:', afterAppUser?.length || 0);
  console.log('');
  if (afterAppUser && afterAppUser.length > 0) {
    afterAppUser.forEach(u => {
      console.log('  ✓', u.email, '(role:', u.role + ')');
    });
  }
}

backfillAppUsers();
