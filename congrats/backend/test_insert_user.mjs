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

async function testInsert() {
    console.log('🧪 Testing manual insert into app_user...');

    const testId = '00000000-0000-0000-0000-000000000001'; // Dummy UUID
    const testEmail = 'debug_insert_test@example.com';

    // First delete if exists
    await supabase.from('app_user').delete().eq('id', testId);

    const { data, error } = await supabase
        .from('app_user')
        .insert({
            id: testId,
            email: testEmail,
            role: 'TALENT'
        })
        .select();

    if (error) {
        console.error('❌ Insert failed:', error);
    } else {
        console.log('✅ Insert successful:', data);
        // Cleanup
        await supabase.from('app_user').delete().eq('id', testId);
    }
}

testInsert();
