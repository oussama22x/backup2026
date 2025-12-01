# 🎯 Shortlist API - Quick Start Guide for Tobi

## What's Been Built

A complete API bridge that allows the **Vetted App** to pull completed audition data from the **Congrats (africaproductpeers) database**. This enables you to display candidate shortlists, review responses, and manage the hiring pipeline directly in your Vetted dashboard.

---

## ✅ Completed Features

### 1. **Get All Candidates for a Job** 
- Endpoint: `GET /api/shortlist/:projectId`
- Returns: All candidates who submitted auditions for your project
- Includes: Names, emails, skills, resume links, submission status, audio responses

### 2. **Get Detailed Candidate Profile**
- Endpoint: `GET /api/shortlist/:projectId/candidate/:candidateId`
- Returns: Full candidate data with transcriptions, work history, proctoring snapshots
- Perfect for: Detailed candidate review modal in your dashboard

### 3. **Update Review Status**
- Endpoint: `PUT /api/shortlist/:projectId/candidate/:candidateId/review`
- Actions: Approve, reject, or shortlist candidates
- Tracks: Who reviewed, when, and any notes

### 4. **Get Project Statistics**
- Endpoint: `GET /api/shortlist/:projectId/stats`
- Returns: Total submissions, completion rates, status breakdown
- Perfect for: Dashboard metrics and project health monitoring

---

## 🚀 How to Use (3 Steps)

### Step 1: Start the Bridge API

The Bridge API is already set up and tested. To run it:

```bash
cd /home/oussama/Desktop/test/supabase-bridge-api
node index.js
```

**It will start on:** `http://localhost:3000`

You should see:
```
Bridge API running on port 3000
Available endpoints:
  GET  /api/shortlist/:projectId - Get all candidates for a project
  GET  /api/shortlist/:projectId/candidate/:candidateId - Get detailed candidate data
  PUT  /api/shortlist/:projectId/candidate/:candidateId/review - Update review status
  GET  /api/shortlist/:projectId/stats - Get project statistics
```

### Step 2: Test with Real Data

Find a project ID from your Vetted database (the UUID of a job posting), then:

```bash
# Get all candidates for a project
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID | jq '.'

# Get project stats
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/stats | jq '.'

# Get specific candidate details
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/candidate/CANDIDATE_ID | jq '.'
```

### Step 3: Integrate into Vetted Dashboard

Add to your Vetted app's environment variables:

```env
VITE_BRIDGE_API_URL=http://localhost:3000
```

Then create an API service file (example provided in full docs):

```typescript
// src/services/shortlistApi.ts
export async function getShortlist(projectId: string) {
  const response = await fetch(`${BRIDGE_API_URL}/api/shortlist/${projectId}`);
  return response.json();
}
```

Use in your React components to display the shortlist!

---

## 📊 Example Response: Candidate List

```json
{
  "project_id": "550e8400-...",
  "total_submissions": 5,
  "last_updated": "2025-01-15T10:30:00.000Z",
  "candidates": [
    {
      "candidate_id": "a1b2c3d4-...",
      "email": "jane.doe@example.com",
      "full_name": "Jane Doe",
      
      "submission_id": "sub-123-...",
      "submitted_at": "2025-01-14T15:22:00.000Z",
      "status": "submitted",
      "duration_seconds": 1800,
      
      "responses": [
        {
          "question_number": 1,
          "question_text": "Tell me about your product management experience",
          "audio_url": "https://supabase.co/storage/.../response1.mp3",
          "transcription": "I have 5 years of experience...",
          "duration": 120
        }
      ],
      
      "skills": ["Product Management", "Agile", "SQL"],
      "location": "Lagos, Nigeria",
      "years_experience": 5,
      "resume_url": "https://...",
      "linkedin_url": "https://linkedin.com/in/janedoe",
      
      "proctoring_snapshots_count": 12,
      "reviewed_at": null
    }
  ]
}
```

---

## 🎨 Dashboard Integration Ideas

### Shortlist Table View
Display candidates in a sortable table:
- Name, Email, Location
- Submission Date
- Status badge (Submitted, Shortlisted, Approved)
- Quick action buttons (Review, Approve, Reject)

### Candidate Detail Modal
Click a candidate to see:
- Full profile (work history, skills, resume)
- Audio responses with transcriptions
- Proctoring snapshots gallery (verify authenticity)
- Review form (approve/reject/shortlist + notes)

### Project Dashboard Card
Show at-a-glance metrics:
- Total candidates: 25
- Completion rate: 88%
- Shortlisted: 5
- Approved: 2
- Average completion time: 28 minutes

---

## 📁 Files Created

1. **`/supabase-bridge-api/index.js`** - Main API server (updated with new endpoints)
2. **`/supabase-bridge-api/SHORTLIST_API_DOCS.md`** - Complete technical documentation
3. **`/supabase-bridge-api/test-shortlist-api.sh`** - Test script for all endpoints
4. **`/supabase-bridge-api/TOBI_QUICKSTART.md`** - This file!

---

## 🔍 What Each Endpoint Returns

### `/api/shortlist/:projectId` (Candidate List)
**What you get:**
- All candidates who submitted auditions
- Basic profile info (name, email, location)
- Skills and experience summary
- Submission metadata (when, how long, status)
- Array of audio responses with transcriptions
- Proctoring snapshot count

**Best for:**
- Main shortlist table
- Filtering/sorting candidates
- Quick candidate overview

---

### `/api/shortlist/:projectId/candidate/:candidateId` (Full Profile)
**What you get:**
- Everything from the list view, plus:
- Complete work history (companies, titles, dates)
- Full bio and contact info
- All proctoring snapshots (images + metadata)
- More detailed transcriptions

**Best for:**
- Detailed candidate review modal
- Verifying candidate authenticity
- Exporting candidate data

---

### `/api/shortlist/:projectId/stats` (Project Metrics)
**What you get:**
- Total submissions count
- Completed vs in-progress
- Status breakdown (submitted, shortlisted, approved, rejected)
- Average completion time
- Completion rate percentage

**Best for:**
- Dashboard summary cards
- Project health monitoring
- Recruiter performance tracking

---

### `PUT /api/shortlist/:projectId/candidate/:candidateId/review` (Update Status)
**What you send:**
```json
{
  "status": "shortlisted",
  "reviewer_id": "your-recruiter-id",
  "reviewer_notes": "Strong technical skills"
}
```

**What you get back:**
```json
{
  "success": true,
  "message": "Candidate shortlisted"
}
```

**Best for:**
- Approve/reject buttons in UI
- Shortlist selection
- Tracking review history

---

## 🛡️ Security Notes

**Current Setup:** No authentication (assumes Bridge API runs in secure backend)

**Before Production:**
1. Add API key authentication
2. Implement rate limiting
3. Add CORS configuration
4. Deploy to secure server (not localhost)

Example security enhancement:
```javascript
// Add API key middleware
app.use('/api/shortlist', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.VETTED_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

---

## 🐛 Troubleshooting

### "Cannot connect to localhost:3000"
**Fix:** Start the Bridge API: `cd supabase-bridge-api && node index.js`

### "No submissions found" but candidates exist
**Fix:** Check that `opportunity_id` in Congrats matches your Vetted `project_id`

### Missing candidate data (null fields)
**Fix:** This is normal if candidates haven't completed their profiles. Display "N/A" in UI.

### "500 Internal Server Error"
**Fix:** 
1. Check Bridge API logs
2. Verify environment variables in `.env` file
3. Test Congrats database connection

---

## 📞 Next Steps

1. **Test with Real Data:** Use a real project ID from your Vetted database
2. **Build UI Components:** Create shortlist table and candidate detail modal
3. **Add Filtering:** Allow filtering by skills, location, status
4. **Deploy API:** Move Bridge API to production server
5. **Add Security:** Implement API key authentication

---

## 💡 Quick Wins for Your Dashboard

### Week 1: Basic Shortlist
- Display candidate list for a project
- Show name, email, submission date
- Add "View Details" button

### Week 2: Candidate Details
- Build modal with full candidate profile
- Embed audio player for responses
- Show transcriptions

### Week 3: Review Actions
- Add approve/reject buttons
- Track review status
- Filter by status (shortlisted, approved, etc.)

### Week 4: Analytics
- Project stats dashboard card
- Completion rate trends
- Reviewer performance metrics

---

## 📚 Full Documentation

For complete API reference, request/response examples, and integration guides, see:

**`/supabase-bridge-api/SHORTLIST_API_DOCS.md`**

---

## ✨ Summary

You now have a **fully functional API** that connects Vetted and Congrats databases. You can:

✅ Pull all candidate submissions for any project
✅ Get detailed candidate profiles with audio responses
✅ Update review status (approve/reject/shortlist)
✅ Track project statistics and metrics

**The API is ready to use!** Just start it with `node index.js` and begin building your dashboard UI.

---

*Built with ❤️ for Vetted | Questions? Check SHORTLIST_API_DOCS.md*
