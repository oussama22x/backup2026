# ✅ Bridge API Integration - Complete Guide

## 🎯 What's Been Done

### ✅ API Server is READY and RUNNING
- Bridge API running on `http://localhost:3000`
- Connected to both Vetted and Congrats databases
- Tested and working

### ✅ Database Structure Identified

**VETTED Database:**
- `projects` table - stores job offers
- `role_definitions` table - stores role context  
- `audition_scaffolds` table - stores AI-generated questions (JSONB)
- Filter: `candidate_source = 'vetted_network'` (only jobs requesting Vetted network)

**CONGRATS Database:**
- `talent_profiles` table - candidate profiles
- `vetting_submissions` table - exam submissions
- Other talent-related tables

---

## 📋 API Endpoints Available

### 1. Get All Jobs from Vetted (for Congrats Dashboard)
```
GET http://localhost:3000/api/vetted/jobs
```

**Returns:**
```json
[
  {
    "id": "uuid",
    "role_title": "Senior Software Engineer",
    "company_name": "Tech Corp",
    "job_description": "...",
    "job_summary": "...",
    "candidate_source": "vetted_network",
    "tier_name": "premium",
    "status": "active",
    "created_at": "2025-11-18T..."
  }
]
```

### 2. Get Specific Job with Questions (for Starting Audition)
```
GET http://localhost:3000/api/vetted/jobs/:id
```

**Returns:**
```json
{
  "id": "uuid",
  "role_title": "Senior Software Engineer",
  "company_name": "Tech Corp",
  "job_description": "...",
  "candidate_source": "vetted_network",
  "role_definition": {
    "id": "uuid",
    "project_id": "uuid",
    "definition_data": { ... }
  },
  "questions": [
    {
      "id": "q1",
      "text": "Tell me about your experience with...",
      "duration": 120,
      "question_type": "behavioral"
    },
    {
      "id": "q2",
      "text": "Describe a challenging project...",
      "duration": 180,
      "question_type": "technical"
    }
  ]
}
```

---

## 🔧 What Needs to Change in CONGRATS

### File: `/congrats/src/pages/talent/Opportunities.tsx`

#### STEP 1: Update Backend URL (Line 14)
```typescript
// OLD:
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// NEW:
const BRIDGE_API_URL = 'http://localhost:3000';
```

#### STEP 2: Update Fetch Opportunities Function (Line 84)
```typescript
// OLD:
const fetchOpportunities = async () => {
  try {
    setIsLoading(true);
    const response = await fetch(`${BACKEND_URL}/api/opportunities`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }
    
    const data = await response.json();
    
    // Transform questions...
    const transformedData = data.map((opp: any) => ({
      ...opp,
      questions: (opp.questions || []).map((q: any, index: number) => ({
        id: `q${index + 1}`,
        text: q.question_text || q.text || q,
        duration: q.time_limit_seconds || q.duration || 120,
      })),
    }));
    
    setOpportunities(transformedData);
    setError(null);
  } catch (err) {
    // ...
  }
};

// NEW:
const fetchOpportunities = async () => {
  try {
    setIsLoading(true);
    // Fetch jobs from Vetted via Bridge API
    const response = await fetch(`${BRIDGE_API_URL}/api/vetted/jobs`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch opportunities from Vetted');
    }
    
    const data = await response.json();
    
    // Transform Vetted projects into Congrats opportunities format
    const transformedData = data.map((project: any) => ({
      id: project.id,
      title: project.role_title,
      company: project.company_name || 'Company',
      location: 'Remote', // Add if Vetted has location field
      type: project.tier_name || 'Full-time',
      rate: '$100k - $150k', // Add if Vetted has salary field
      skills: [], // Extract from job_description if needed
      questions: [], // Will be loaded when starting audition
    }));
    
    setOpportunities(transformedData);
    setError(null);
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    setError(err instanceof Error ? err.message : 'Failed to load opportunities');
  } finally {
    setIsLoading(false);
  }
};
```

#### STEP 3: Update Start Audition Handler
Find the function that handles starting an audition (around line 200-250) and update it:

```typescript
// When candidate clicks "Start Audition", fetch questions from Vetted
const handleStartAudition = async (opportunityId: string) => {
  try {
    setIsStarting(true);
    
    // Fetch full job details with questions from Vetted
    const response = await fetch(`${BRIDGE_API_URL}/api/vetted/jobs/${opportunityId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch job details');
    }
    
    const jobWithQuestions = await response.json();
    
    // Transform questions to Congrats format
    const opportunity = {
      id: jobWithQuestions.id,
      title: jobWithQuestions.role_title,
      company: jobWithQuestions.company_name,
      questions: jobWithQuestions.questions.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        text: q.text || q.question_text,
        duration: q.duration || q.time_limit_seconds || 120,
      })),
    };
    
    setSelectedOpportunity(opportunity);
    setAuditionInProgress(true);
    
  } catch (err) {
    console.error('Error starting audition:', err);
    toast({
      title: "Error",
      description: "Failed to start audition. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsStarting(false);
  }
};
```

---

## 🚀 Testing Steps

### 1. Verify API is Running
```bash
curl http://localhost:3000/api/vetted/jobs
```

Should return JSON array of jobs.

### 2. Test in Browser
Open Congrats dashboard and check:
- Jobs from Vetted appear in opportunities list ✅
- Click "Start Audition" loads questions from Vetted ✅
- Questions display correctly ✅
- 30-minute exam works ✅

### 3. Test End-to-End Flow
1. **In Vetted**: Create new job with `candidate_source = 'vetted_network'`
2. **In Congrats**: Refresh opportunities page
3. **Expected**: New job appears immediately
4. **In Congrats**: Click "Start Audition"
5. **Expected**: AI-generated questions load and exam starts

---

## 🔒 Production Deployment

### Step 1: Deploy Bridge API
Deploy to Heroku, Railway, Render, or your preferred platform.

Example with Railway:
```bash
cd /home/oussama/test/supabase-bridge-api
railway init
railway up
```

### Step 2: Update Environment Variables
In production, set:
```
SUPABASE_A_URL=https://rlcbepueqvuwpooxbiad.supabase.co
SUPABASE_A_KEY=eyJhbGci...
SUPABASE_B_URL=https://gsaoafdlxtfqacloonrv.supabase.co
SUPABASE_B_KEY=eyJhbGci...
PORT=3000
```

### Step 3: Update CORS Settings
In `index.js`, update CORS to allow your production URLs:
```javascript
app.use(cors({
  origin: [
    'https://your-congrats-domain.com',
    'https://your-vetted-domain.com'
  ],
  credentials: true
}));
```

### Step 4: Update Frontend URLs
Replace `http://localhost:3000` with your production API URL:
```typescript
const BRIDGE_API_URL = 'https://your-bridge-api.railway.app';
```

---

## 📊 Current Status

✅ **COMPLETED:**
- Bridge API server created and running
- Database structure analyzed
- Endpoints implemented and tested
- Documentation created

⏳ **NEXT STEPS (Tonight):**
1. Update Congrats `Opportunities.tsx` with new API calls (20 min)
2. Test full flow: Vetted → Bridge API → Congrats (10 min)
3. Verify questions load correctly (5 min)

**Total time to complete: ~35 minutes** 🚀

---

## 🆘 Troubleshooting

### Issue: API not returning data
```bash
# Check API is running
curl http://localhost:3000/api/vetted/jobs

# Check Vetted database has jobs
# In Supabase SQL Editor:
SELECT * FROM projects WHERE candidate_source = 'vetted_network';
```

### Issue: Questions not loading
```bash
# Test specific job endpoint
curl http://localhost:3000/api/vetted/jobs/YOUR_JOB_ID

# Check if job has audition scaffold
# In Supabase SQL Editor:
SELECT * FROM audition_scaffolds WHERE role_definition_id IN 
  (SELECT id FROM role_definitions WHERE project_id = 'YOUR_JOB_ID');
```

### Issue: CORS errors in browser
Update `index.js`:
```javascript
app.use(cors({
  origin: '*', // For development only
  credentials: true
}));
```

---

## 📞 Support

If you encounter any issues:
1. Check API logs: Terminal where `node index.js` is running
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test endpoints individually with curl

**You're ready to integrate! 🎉**
