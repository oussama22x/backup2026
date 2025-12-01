# 🎯 Quick Test Guide - See Candidates in Vetted

## ✅ Fix Applied

**Problem:** Bridge API was pointing to wrong Congrats database  
**Solution:** Updated `.env` to use correct database URL

---

## 🧪 Test Right Now

### Step 1: Bridge API is Already Running ✅

The Bridge API is running and connected to the correct database!

### Step 2: Test with Real Project IDs

You have **10 submissions** in the database. Try these opportunity IDs in Vetted:

```
08d3d726-f5c3-4948-a2f7-5d2c6470df5d  ✅ (1 candidate)
bb427cbf-971b-4c89-ad45-75de8a4e7d92
ac91b0d7-1673-4173-b7d3-9b0015e1ae3b
306052df-5c4c-4fb3-99fa-b36f7fd009ef
550e8400-e29b-41d4-a716-446655440001
42aefe8b-d653-4bd4-a05e-1af3c43953b9
8e123a4b-14c9-4db7-8430-432b84bc4b14
59cc2d63-3d17-479b-a663-6f0bea14a7fb
ceb3320f-60c6-4260-8c82-223cc8d3ccf3
a5651274-002b-4e31-b989-a3860156d938
```

### Step 3: Open Vetted App

1. Open browser to Vetted app
2. Navigate to a project with one of these IDs
3. Scroll to bottom → **"Candidate Shortlist"** section
4. You should now see candidates! 🎉

---

## 📝 Note About Data

The submissions currently show:
- ✅ **Status:** `started` (audition in progress)
- ⚠️ **Profile data:** May be incomplete if candidate hasn't filled profile

This is normal! When candidates complete their profiles and auditions, you'll see:
- Full name
- Email
- Skills
- Location
- Audio responses
- Transcriptions

---

## 🔧 For Complete Test

To see FULL candidate data with all fields:

### Option 1: Complete Profile in Congrats App
1. Open Congrats app: `http://localhost:5174`
2. Log in as the candidate
3. Go to Profile page
4. Fill in:
   - Full name
   - Location
   - Skills
   - Years of experience
   - Upload resume
   - Add LinkedIn URL
5. Complete an audition fully
6. Return to Vetted and refresh

### Option 2: Use Existing Data
The current submissions are already visible, they just need:
- Profile completion
- Full audition completion (not just "started")

---

## 🎯 What You'll See Now

In Vetted Project Detail page, at the bottom:

```
┌─────────────────────────────────────────────────────┐
│ 📊 Statistics                                       │
├──────────┬──────────┬──────────┬───────────────────┤
│ Total: 1 │ Comp: 1  │ Dur: 0m  │ Rate: 100.00%     │
└──────────┴──────────┴──────────┴───────────────────┘

┌─────────────────────────────────────────────────────┐
│ 👥 Candidates (1)                                   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ 👤 Anonymous Candidate  [started]       ▼  │   │
│ │    (no email)                               │   │
│ │                                             │   │
│ │    📅 3 hours ago                           │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**The list will no longer say "No candidates applied"!** ✅

---

## 🚀 Next Steps

1. **Refresh Vetted app** - Candidates should appear now
2. **Complete candidate profiles** in Congrats for better data
3. **Test review actions** (Approve/Reject/Shortlist)

---

## ✅ Summary

**Fixed Issues:**
1. ✅ Bridge API now points to correct Congrats database
2. ✅ API returns all submissions (not just "completed" ones)
3. ✅ Shortlist component shows candidates

**You should now see candidates in Vetted!** 🎉
