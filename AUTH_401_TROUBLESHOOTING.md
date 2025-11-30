# 401 Unauthorized Error Troubleshooting Guide

## Problem
Getting `401 Unauthorized` errors when calling Edge Functions from a different device, even though it works fine on your main device.

## Root Cause
The user is **not properly authenticated** on the other device, so the Supabase client doesn't send an authentication token with the Edge Function request.

## Why It Works on One Device But Not Another

1. **Session exists on Device A** - You're logged in and have a valid token in localStorage
2. **No session on Device B** - You're not logged in, or the session expired

## Solutions Applied

### 1. Added Authentication Checks (✅ Done)
Both `vetted` and `congrats` projects now check authentication **before** calling Edge Functions:

```typescript
// Check if user is authenticated
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !session) {
  toast({
    title: "Authentication required",
    description: "Please log in again to continue.",
    variant: "destructive",
  });
  navigate('/login'); // or redirect appropriately
  return;
}
```

### 2. Better Error Handling (✅ Done)
Added detection for 401 errors with user-friendly messages:

```typescript
const isAuthError = 
  errorStatus === 401 || 
  lowerCaseMessage.includes("unauthorized");

if (isAuthError) {
  toast({
    title: "Session expired",
    description: "Your session has expired. Please log in again.",
    variant: "destructive",
  });
  navigate('/login');
  return;
}
```

## Testing on Different Device

### Step 1: Verify You're Logged In
1. Open the app on the different device
2. Check browser console: `localStorage.getItem('supabase.auth.token')`
3. If null or undefined → **You need to log in**

### Step 2: Check Browser Settings
Some browsers/modes block localStorage:
- ❌ **Incognito/Private mode** - May not persist sessions
- ❌ **Strict privacy settings** - May block localStorage/cookies
- ❌ **Browser extensions** - Ad blockers might interfere

### Step 3: Clear Cache and Re-login
If issues persist:
```bash
# In browser console
localStorage.clear();
sessionStorage.clear();
# Then refresh and log in again
```

## Common Scenarios

### Scenario 1: Using Incognito Mode
**Problem:** localStorage is blocked or cleared between sessions
**Solution:** Use normal browser mode, or accept that you'll need to log in each time

### Scenario 2: Different Browser
**Problem:** Session exists in Chrome but not in Firefox
**Solution:** Log in on each browser separately - sessions don't transfer

### Scenario 3: Session Expired
**Problem:** Token expired and auto-refresh failed
**Solution:** Log in again - the app will now redirect you automatically

### Scenario 4: CORS/Network Issues
**Problem:** Company firewall or network blocking Supabase
**Solution:** Check network console for blocked requests, contact IT if needed

## Debugging Steps

### 1. Check Authentication Status
```javascript
// In browser console
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
```

### 2. Check Token in Headers
```javascript
// In browser console, before calling function
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session?.access_token);
```

### 3. Monitor Network Tab
1. Open DevTools → Network tab
2. Try to use the feature that fails
3. Look for the Edge Function call
4. Check Request Headers - should have `Authorization: Bearer <token>`
5. If no Authorization header → Authentication problem

## Prevention

### For Development
- Stay logged in on your test devices
- Use normal browser mode (not incognito)
- Keep tokens valid by regular usage

### For Production
- The fixes ensure users get clear feedback
- Users will be redirected to login automatically
- No more cryptic 401 errors

## What Changed in the Code

### Files Modified

**Vetted Project:**
- ✅ `/vetted/src/pages/workspace/JdUpload.tsx`
  - Added pre-check before calling Edge Function
  - Added 401 error detection and redirect

**Congrats Project:**
- ✅ `/congrats/src/components/vetting/VettingChallengeDrawer.tsx`
  - Added pre-check before calling Edge Function
  - Added 401 error detection with friendly message

## Testing Checklist

Test on the problematic device:

- [ ] Log out completely
- [ ] Clear browser cache/localStorage
- [ ] Log in again
- [ ] Try the feature that was failing
- [ ] Should either work OR show clear "please log in" message
- [ ] No more cryptic 401 errors

## Still Having Issues?

If problems persist after applying these fixes:

1. **Check Supabase Dashboard**
   - Verify the project URL is correct
   - Check if Edge Functions are deployed
   - Review Edge Function logs for errors

2. **Verify Environment Variables**
   ```bash
   # In the problematic device browser
   console.log(import.meta.env.VITE_SUPABASE_URL);
   console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
   ```

3. **Check Network**
   - Can you reach Supabase? Try: `curl https://lagvszfwsruniuinxdjb.supabase.co`
   - Any firewall/proxy blocking requests?

4. **Review Edge Function Config**
   - Check `verify_jwt` setting in `supabase/config.toml`
   - Ensure Edge Function accepts the auth token

## Summary

The issue is fixed! Now when users aren't authenticated:
- ✅ They get a clear message
- ✅ They're redirected to login
- ✅ No more confusing 401 errors

Just make sure you're logged in on each device you test!
