import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to load env vars
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.join(__dirname, 'backend/.env');
const localEnvPath = path.join(__dirname, '.env');

let env = {};
if (fs.existsSync(backendEnvPath)) Object.assign(env, loadEnv(backendEnvPath));
if (fs.existsSync(localEnvPath)) Object.assign(env, loadEnv(localEnvPath));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_USER_ID = '1f87251e-5666-4ec5-bb3c-93ca24bee162';

async function testSignedUrls() {
    console.log("🔍 Testing Signed URL Generation...\n");

    // 1. Check for audio files
    console.log("1️⃣ Checking Audio Files:");
    const { data: answers } = await supabase
        .from('audition_answers')
        .select('audio_url')
        .eq('user_id', TEST_USER_ID)
        .limit(1);

    if (answers && answers.length > 0) {
        const audioUrl = answers[0].audio_url;
        console.log(`   Raw audio_url: ${audioUrl}`);

        if (audioUrl && !audioUrl.startsWith('http')) {
            console.log(`   ⚠️  Audio URL is a storage path (not public)`);
            const { data: signed } = await supabase.storage
                .from('audition-recordings')
                .createSignedUrl(audioUrl, 31536000);

            if (signed) {
                console.log(`   ✅ Generated signed URL: ${signed.signedUrl.substring(0, 80)}...`);
            } else {
                console.log(`   ❌ Failed to generate signed URL`);
            }
        } else {
            console.log(`   ℹ️  Audio URL is already public (starts with http)`);
        }
    } else {
        console.log(`   ⚠️  No audio files found for test user`);
    }

    // 2. Check for resume files
    console.log("\n2️⃣ Checking Resume Files:");
    const { data: resume } = await supabase
        .from('talent_files')
        .select('file_url')
        .eq('user_id', TEST_USER_ID)
        .eq('file_type', 'resume')
        .limit(1)
        .single();

    if (resume && resume.file_url) {
        const resumeUrl = resume.file_url;
        console.log(`   Raw file_url: ${resumeUrl}`);

        if (resumeUrl && !resumeUrl.startsWith('http')) {
            console.log(`   ⚠️  Resume URL is a storage path (not public)`);
            const { data: signed } = await supabase.storage
                .from('resumes')
                .createSignedUrl(resumeUrl, 31536000);

            if (signed) {
                console.log(`   ✅ Generated signed URL: ${signed.signedUrl.substring(0, 80)}...`);
            } else {
                console.log(`   ❌ Failed to generate signed URL`);
            }
        } else {
            console.log(`   ℹ️  Resume URL is already public (starts with http)`);
        }
    } else {
        console.log(`   ⚠️  No resume file found for test user`);
    }

    // 3. Check bucket policies
    console.log("\n3️⃣ Checking Storage Bucket Policies:");
    console.log("   Run this in Supabase Dashboard > Storage:");
    console.log("   - Check if 'audition-recordings' bucket is PUBLIC or PRIVATE");
    console.log("   - Check if 'resumes' bucket is PUBLIC or PRIVATE");
    console.log("\n   If buckets are PUBLIC, signed URLs are not needed (but won't hurt).");
    console.log("   If buckets are PRIVATE, signed URLs are REQUIRED for VettedAI to access files.");

    console.log("\n✅ Test Complete!");
}

testSignedUrls();
