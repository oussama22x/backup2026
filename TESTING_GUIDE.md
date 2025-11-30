# 🧪 TESTING GUIDE: Authentication Fix

## ⚠️ IMPORTANT: Clear Browser Cache First!

The frontend changes won't work if your browser has the old JavaScript cached.

### Step 1: Clear Browser Cache
**Option A - Hard Refresh:**
- Chrome/Edge: `Ctrl + Shift + R` (Linux/Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` or `Ctrl + Shift + R`

**Option B - Clear All Cache:**
1. Open Developer Tools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C - Use Incognito/Private Mode:**
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

---

## 📋 Complete Test Flow

### Test 1: Sign Up New User

1. **Open browser in incognito mode**
   ```
   http://localhost:8083
   ```

2. **Click "Sign Up"**

3. **Enter email & password**
   - Email: test123@example.com
   - Password: Test1234!
   - Confirm password: Test1234!

4. **Click Next/Submit**
   - ✅ Should see "Account Created!" toast
   - ✅ Should redirect to profile wizard
   - ✅ New auth user + app_user created automatically

5. **Check browser console** (`F12`)
   - Look for: `✅ Created app_user record for: test123@example.com`

---

### Test 2: Try to Start Audition

1. **Navigate to Opportunities**
   ```
   http://localhost:8083/talent/opportunities
   ```

2. **WITHOUT logging in**, click "Start Audition" on any job
   - ✅ Should see: "Sign In Required" toast
   - ✅ Should redirect to `/signup`
   - ❌ Should NOT be able to start audition

3. **Sign in with one of these existing users:**
   - oussamaelboukhari00@gmail.com
   - google13@gmail.com
   - oussama09@gmail.com
   - oussamaelboukhari2@gmail.com
   - oussamaelboukhari11@gmail.com

4. **After login, try again:**
   - ✅ Should open audition modal
   - ✅ Should allow starting audition
   - ✅ Submission should use REAL user ID

---

### Test 3: Verify Database Records

After completing an audition, run this in terminal:

```bash
cd /home/oussama/Desktop/test/congrats/backend && node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Get auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUserIds = authData.users.map(u => u.id);
  
  // Get recent submission
  const { data: submissions } = await supabase
    .from('audition_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(1);
  
  const latest = submissions[0];
  const isAuth = authUserIds.includes(latest.user_id);
  const user = authData.users.find(u => u.id === latest.user_id);
  
  console.log('📝 Latest Submission:');
  console.log('   ID:', latest.id);
  console.log('   User ID:', latest.user_id);
  console.log('   Is Auth User:', isAuth ? '✅ YES' : '❌ NO');
  if (user) {
    console.log('   Email:', user.email);
  }
  console.log('   Submitted:', latest.submitted_at);
})();
"
```

**Expected Output:**
```
📝 Latest Submission:
   ID: [new-submission-id]
   User ID: [auth-user-id]
   Is Auth User: ✅ YES
   Email: test123@example.com
   Submitted: 2025-11-19T...
```

---

### Test 4: Verify Bridge API Returns Email

```bash
curl -s http://localhost:3000/api/shortlist/08d3d726-f5c3-4948-a2f7-5d2c6470df5d | jq '.candidates[0]' | head -30
```

**Expected Output for NEW submission:**
```json
{
  "candidate_id": "0a2668f5-2b1f-43c3-90a2-ae2e9aac3975",
  "email": "test123@example.com",        ← ✅ EMAIL PRESENT!
  "full_name": "test123",                ← ✅ NAME PRESENT!
  "submission_id": "...",
  "status": "started"
}
```

**Expected Output for OLD submissions:**
```json
{
  "candidate_id": "a86debc8-0ef0-4466-bb27-f7b36596d881",
  "email": null,                         ← ❌ Still null (orphaned)
  "full_name": null,
  "submission_id": "...",
  "status": "started"
}
```

---

## 🐛 Troubleshooting

### Problem: Still creating orphaned submissions

**Solution 1: Force browser cache clear**
1. Close ALL browser tabs of Congrats app
2. Clear browser cache completely
3. Restart browser
4. Open in incognito mode
5. Try again

**Solution 2: Check if you're logged in**
1. Open browser console (`F12`)
2. Go to Application/Storage → Local Storage
3. Look for `sb-[project-id]-auth-token`
4. If missing, you're not logged in!

**Solution 3: Check currentUser in console**
1. Open browser console
2. Type: `localStorage.getItem('sb-uvszvjbzcvkgktrvavqe-auth-token')`
3. Should return a token if logged in

### Problem: "Sign In Required" not showing

**Check:** Auth redirect might be disabled
1. Verify you're accessing `/talent/opportunities` (not root `/`)
2. Check browser console for errors
3. Make sure frontend dev server is running on http://localhost:8083

### Problem: New user not created in database

**Check signup completion:**
```bash
cd /home/oussama/Desktop/test/congrats/backend && node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase.auth.admin.listUsers();
  console.log('Recent users:');
  data.users
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)
    .forEach(u => console.log('-', u.email, '- Created:', u.created_at));
})();
"
```

---

## ✅ Success Criteria

After testing, you should see:

- [ ] New user can sign up successfully
- [ ] app_user record created automatically
- [ ] Cannot start audition without login
- [ ] After login, audition works
- [ ] New submission uses auth user ID
- [ ] Bridge API returns email for new submissions
- [ ] Vetted app shows email/name for new candidates

---

## 🚀 Next: Test with Vetted App

1. Ensure Vetted frontend is running
2. Navigate to project shortlist
3. ✅ NEW candidates should show email/name
4. ❌ OLD (orphaned) candidates still show "Not available"

This is EXPECTED behavior - old submissions before the fix cannot be recovered.
