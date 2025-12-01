# Shortlist API Documentation

## Overview

The Shortlist API allows the Vetted app to retrieve completed audition data from the Congrats (africaproductpeers) database. This enables recruiters to view candidate submissions, review responses, and manage the shortlisting process.

**Base URL:** `http://localhost:3000` (or your deployed Bridge API URL)

---

## Endpoints

### 1. Get All Candidates for a Project

**Endpoint:** `GET /api/shortlist/:projectId`

**Description:** Returns all candidate submissions for a specific Vetted project/job posting, including basic profile data, submission status, and response summaries.

**Parameters:**
- `projectId` (URL param, required): The UUID of the Vetted project (matches `opportunity_id` in Congrats)

**Example Request:**
```bash
curl http://localhost:3000/api/shortlist/550e8400-e29b-41d4-a716-446655440000
```

**Example Response:**
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
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
      
      "questions": [
        "Tell me about your product management experience",
        "How do you prioritize features?"
      ],
      "responses": [
        {
          "question_number": 1,
          "question_text": "Tell me about your product management experience",
          "audio_url": "https://supabase.co/storage/.../response1.mp3",
          "file_path": "auditions/user-123/response-1.mp3",
          "transcription": "I have 5 years of experience...",
          "duration": 120
        }
      ],
      
      "skills": ["Product Management", "Agile", "SQL"],
      "location": "Lagos, Nigeria",
      "years_experience": 5,
      "resume_url": "https://supabase.co/storage/.../resume.pdf",
      "linkedin_url": "https://linkedin.com/in/janedoe",
      "portfolio_url": "https://janedoe.com",
      
      "proctoring_snapshots_count": 12,
      "ip_address": "197.210.xx.xx",
      "user_agent": "Mozilla/5.0...",
      
      "reviewed_at": null,
      "reviewer_id": null
    }
  ]
}
```

**Use Cases:**
- Display candidate shortlist in Vetted dashboard
- Show submission counts and basic candidate info
- Filter/sort candidates by submission date, skills, location

---

### 2. Get Detailed Candidate Data

**Endpoint:** `GET /api/shortlist/:projectId/candidate/:candidateId`

**Description:** Returns comprehensive data for a specific candidate including full transcriptions, work history, proctoring snapshots, and complete profile.

**Parameters:**
- `projectId` (URL param, required): The UUID of the Vetted project
- `candidateId` (URL param, required): The UUID of the candidate (user_id)

**Example Request:**
```bash
curl http://localhost:3000/api/shortlist/550e8400-e29b-41d4-a716-446655440000/candidate/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Example Response:**
```json
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
      "file_path": "auditions/user-123/response-1.mp3",
      "transcription": "I have 5 years of experience in product management, starting at...",
      "duration": 120
    }
  ],
  
  "profile": {
    "full_name": "Jane Doe",
    "location": "Lagos, Nigeria",
    "years_experience": 5,
    "bio": "Passionate product manager with focus on fintech",
    "resume_url": "https://...",
    "linkedin_url": "https://...",
    "portfolio_url": "https://...",
    "phone": "+234-xxx-xxx-xxxx"
  },
  
  "skills": ["Product Management", "Agile", "SQL", "Figma"],
  
  "experiences": [
    {
      "company": "TechCorp",
      "title": "Senior Product Manager",
      "start_date": "2022-06-01",
      "end_date": null,
      "is_current": true,
      "description": "Led product development for payment platform..."
    }
  ],
  
  "proctoring": {
    "total_snapshots": 12,
    "snapshots": [
      {
        "snapshot_url": "https://supabase.co/storage/.../snapshot1.jpg",
        "captured_at": "2025-01-14T15:25:00.000Z",
        "metadata": {
          "face_detected": true,
          "multiple_faces": false
        }
      }
    ]
  },
  
  "ip_address": "197.210.xx.xx",
  "user_agent": "Mozilla/5.0...",
  "reviewed_at": null,
  "reviewer_id": null
}
```

**Use Cases:**
- Display full candidate profile in Vetted dashboard modal
- Show audio responses with transcriptions for review
- Verify candidate authenticity via proctoring snapshots
- Export candidate data for external evaluation

---

### 3. Update Review Status

**Endpoint:** `PUT /api/shortlist/:projectId/candidate/:candidateId/review`

**Description:** Update the review status of a candidate's submission (approve, reject, shortlist).

**Parameters:**
- `projectId` (URL param, required): The UUID of the Vetted project
- `candidateId` (URL param, required): The UUID of the candidate

**Request Body:**
```json
{
  "status": "shortlisted",
  "reviewer_id": "recruiter-uuid-123",
  "reviewer_notes": "Strong technical skills, good communication"
}
```

**Body Fields:**
- `status` (required): One of `"approved"`, `"rejected"`, or `"shortlisted"`
- `reviewer_id` (optional): UUID of the recruiter performing the review
- `reviewer_notes` (optional): Notes about the review decision

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/shortlist/550e8400.../candidate/a1b2c3d4.../review \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shortlisted",
    "reviewer_id": "rec-123-...",
    "reviewer_notes": "Excellent responses"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Candidate shortlisted",
  "data": [
    {
      "id": "sub-123-...",
      "status": "shortlisted",
      "reviewed_at": "2025-01-15T10:30:00.000Z",
      "reviewer_id": "rec-123-..."
    }
  ]
}
```

**Use Cases:**
- Mark candidates as approved/rejected from Vetted dashboard
- Track who reviewed each candidate and when
- Filter shortlist by review status

---

### 4. Get Project Statistics

**Endpoint:** `GET /api/shortlist/:projectId/stats`

**Description:** Returns aggregated statistics for a project's candidate pool.

**Parameters:**
- `projectId` (URL param, required): The UUID of the Vetted project

**Example Request:**
```bash
curl http://localhost:3000/api/shortlist/550e8400-e29b-41d4-a716-446655440000/stats
```

**Example Response:**
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_submissions": 25,
  "completed_submissions": 22,
  "in_progress": 3,
  "status_breakdown": {
    "submitted": 15,
    "in_progress": 3,
    "shortlisted": 5,
    "approved": 2,
    "rejected": 0
  },
  "average_duration_seconds": 1650,
  "average_duration_minutes": 28,
  "completion_rate": "88.00%",
  "last_submission": "2025-01-15T09:45:00.000Z"
}
```

**Use Cases:**
- Display project overview metrics in Vetted dashboard
- Track completion rates
- Monitor candidate pipeline health

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters or request body
- `404 Not Found`: Resource (project or candidate) not found
- `500 Internal Server Error`: Server-side error

**Error Response Format:**
```json
{
  "error": "Submission not found"
}
```

---

## Authentication

**Current Implementation:** No authentication (assumes Bridge API runs in secure backend environment)

**Recommended for Production:**
1. Add API key authentication to Bridge API
2. Verify requests come from authorized Vetted backend
3. Implement rate limiting (e.g., 100 requests/minute per project)
4. Add CORS configuration for allowed origins

**Example Production Setup:**
```javascript
// Add to Bridge API
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.VETTED_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use('/api/shortlist', validateApiKey);
```

---

## Integration Guide for Vetted App

### Step 1: Environment Setup

Add Bridge API URL to Vetted's environment variables:

```env
# .env.local
VITE_BRIDGE_API_URL=http://localhost:3000
```

### Step 2: Create API Service

```typescript
// src/services/shortlistApi.ts
const BRIDGE_API = import.meta.env.VITE_BRIDGE_API_URL;

export async function getShortlist(projectId: string) {
  const response = await fetch(`${BRIDGE_API}/api/shortlist/${projectId}`);
  if (!response.ok) throw new Error('Failed to fetch shortlist');
  return response.json();
}

export async function getCandidateDetails(projectId: string, candidateId: string) {
  const response = await fetch(
    `${BRIDGE_API}/api/shortlist/${projectId}/candidate/${candidateId}`
  );
  if (!response.ok) throw new Error('Failed to fetch candidate');
  return response.json();
}

export async function updateReviewStatus(
  projectId: string, 
  candidateId: string, 
  status: 'approved' | 'rejected' | 'shortlisted',
  reviewerId: string
) {
  const response = await fetch(
    `${BRIDGE_API}/api/shortlist/${projectId}/candidate/${candidateId}/review`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewer_id: reviewerId })
    }
  );
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
}
```

### Step 3: Display in Dashboard

```tsx
// Example: Shortlist page component
import { useEffect, useState } from 'react';
import { getShortlist } from '@/services/shortlistApi';

export function ShortlistPage({ projectId }: { projectId: string }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const data = await getShortlist(projectId);
        setCandidates(data.candidates);
      } catch (error) {
        console.error('Failed to load candidates:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, [projectId]);

  if (loading) return <div>Loading candidates...</div>;

  return (
    <div>
      <h1>Shortlist ({candidates.length} candidates)</h1>
      {candidates.map(candidate => (
        <CandidateCard 
          key={candidate.candidate_id}
          candidate={candidate}
        />
      ))}
    </div>
  );
}
```

---

## Testing

### Start Bridge API

```bash
cd supabase-bridge-api
node index.js
```

### Test Endpoints

```bash
# Get shortlist (replace with actual project ID)
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID

# Get candidate details
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/candidate/CANDIDATE_ID

# Get stats
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/stats
```

### Test Review Update

```bash
curl -X PUT http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/candidate/CANDIDATE_ID/review \
  -H "Content-Type: application/json" \
  -d '{"status": "shortlisted", "reviewer_id": "your-recruiter-id"}'
```

---

## Data Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  Vetted App     │────────>│  Bridge API      │────────>│  Congrats Database  │
│  (Recruiter)    │  HTTP   │  (Express.js)    │  REST   │  (Supabase)         │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
                                                                   │
                                                                   ├─ audition_submissions
                                                                   ├─ app_user
                                                                   ├─ talent_profiles
                                                                   ├─ talent_skills
                                                                   ├─ talent_experiences
                                                                   └─ proctoring_snapshots
```

---

## Troubleshooting

### Issue: "No submissions found"

**Cause:** Project ID doesn't match any `opportunity_id` in Congrats database

**Solution:** 
1. Verify the project exists in Vetted
2. Check that candidates have taken auditions for this project
3. Confirm `opportunity_id` in `audition_submissions` matches Vetted's project UUID

### Issue: "500 Internal Server Error"

**Cause:** Database connection failed or query error

**Solution:**
1. Check Bridge API logs in terminal
2. Verify `SUPABASE_B_URL` and `SUPABASE_B_KEY` environment variables
3. Test Congrats database connection: `curl https://uvszvjbzcvkgktrvavqe.supabase.co/rest/v1/app_user?select=count`

### Issue: Missing candidate data (null fields)

**Cause:** Candidate hasn't completed their profile

**Solution:** This is expected. Display "N/A" or "Not provided" in UI for null fields.

---

## Roadmap / Future Enhancements

- [ ] Add pagination for large candidate lists
- [ ] Add filtering by skills, location, experience
- [ ] Add sorting by submission date, duration, review status
- [ ] Add candidate scoring/ranking endpoint
- [ ] Add bulk review actions (approve/reject multiple)
- [ ] Add email notifications when recruiter reviews candidate
- [ ] Add candidate comparison endpoint (side-by-side)
- [ ] Add export to CSV/PDF functionality
- [ ] Add webhook support for real-time updates

---

## Support

For issues or questions, contact:
- **Tobi** (Product Lead)
- **Development Team** via Slack

**Related Documentation:**
- [Complete Flow Analysis](../congrats/COMPLETE_FLOW_ANALYSIS.md)
- [Congrats Database Schema](../congrats/backend/supabase/schema.sql)
- [Bridge API Setup](./README.md)
