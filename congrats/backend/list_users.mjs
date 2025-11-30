import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
    console.log('🔍 Listing users in app_user table...\n');

    const { data: users, error } = await supabase
        .from('app_user')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('❌ No users found in app_user table.');
    } else {
        console.log(`✅ Found ${users.length} users:`);
        users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    }
}

listUsers();
