# Supabase Bridge API

Express.js API server that connects the **Vetted** and **Congrats** Supabase databases, enabling cross-project data access.

## Purpose

This API acts as a bridge between two separate Supabase projects:
- **VETTED** (Database A): Recruiter platform for creating job postings and generating interview questions
- **CONGRATS** (Database B): Candidate platform for taking auditions and submitting responses

The Bridge API allows Vetted recruiters to access completed audition data from Congrats candidates.

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  Vetted App     │────────>│  Bridge API      │────────>│  Congrats Database  │
│  (Frontend)     │  HTTP   │  (Express.js)    │  REST   │  (Supabase B)       │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
                                      │
                                      │
                                      v
                            ┌─────────────────────┐
                            │  Vetted Database    │
                            │  (Supabase A)       │
                            └─────────────────────┘
```

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

# Vetted Database (Supabase A)
SUPABASE_A_URL=https://lagvszfwsruniuinxdjb.supabase.co
SUPABASE_A_KEY=your_vetted_service_role_key

# Congrats Database (Supabase B)
SUPABASE_B_URL=https://uvszvjbzcvkgktrvavqe.supabase.co
SUPABASE_B_KEY=your_congrats_service_role_key
```

**Security Note:** Use **service role keys** (not anon keys) to bypass RLS policies.

### 3. Start Server

```bash
node index.js
```

The server will start on `http://localhost:3000`

---

## Available Endpoints

### Vetted Database Endpoints

#### Get All Jobs
```
GET /api/vetted/jobs
```
Returns all job postings from Vetted database.

#### Get Job with Questions
```
GET /api/vetted/jobs/:id
```
Returns job details, role definitions, and audition questions.

---

### Congrats Database Endpoints (Shortlist API)

#### Get Candidate Shortlist
```
GET /api/shortlist/:projectId
```
Returns all candidates who submitted auditions for a specific project.

**Response:**
```json
{
  "project_id": "uuid",
  "total_submissions": 5,
  "candidates": [
    {
      "candidate_id": "uuid",
      "email": "candidate@example.com",
      "full_name": "John Doe",
      "skills": ["Python", "SQL"],
      "responses": [...],
      "status": "submitted"
    }
  ]
}
```

#### Get Candidate Details
```
GET /api/shortlist/:projectId/candidate/:candidateId
```
Returns comprehensive candidate profile including transcriptions and proctoring data.

#### Update Review Status
```
PUT /api/shortlist/:projectId/candidate/:candidateId/review
```
Update candidate review status (approved, rejected, shortlisted).

**Body:**
```json
{
  "status": "shortlisted",
  "reviewer_id": "uuid",
  "reviewer_notes": "optional"
}
```

#### Get Project Statistics
```
GET /api/shortlist/:projectId/stats
```
Returns aggregated statistics for a project's candidate pool.

**Response:**
```json
{
  "total_submissions": 25,
  "completed_submissions": 22,
  "status_breakdown": {
    "submitted": 15,
    "shortlisted": 5
  },
  "average_duration_minutes": 28,
  "completion_rate": "88.00%"
}
```

---

## Testing

### Start Server
```bash
node index.js
```

### Run Test Suite
```bash
./test-shortlist-api.sh
```

### Manual Testing
```bash
# Get shortlist
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID | jq '.'

# Get stats
curl http://localhost:3000/api/shortlist/YOUR_PROJECT_ID/stats | jq '.'

# Update review status
curl -X PUT http://localhost:3000/api/shortlist/PROJECT_ID/candidate/CANDIDATE_ID/review \
  -H "Content-Type: application/json" \
  -d '{"status": "shortlisted"}'
```

---

## Documentation

- **`SHORTLIST_API_DOCS.md`** - Complete API reference with examples
- **`TOBI_QUICKSTART.md`** - Quick start guide for integrating into Vetted dashboard

---

## Data Flow

### Recruiter Creates Job (Vetted)
1. Recruiter uploads job description
2. AI generates 90 questions
3. Recruiter selects 10 questions
4. Job posted with `opportunity_id`

### Candidate Takes Audition (Congrats)
1. Candidate browses jobs (pulled from Vetted API)
2. Starts audition for `opportunity_id`
3. Records audio responses
4. Submits to Congrats database

### Recruiter Reviews Candidates (Vetted → Bridge API → Congrats)
1. Vetted dashboard calls Bridge API
2. Bridge API queries Congrats database
3. Returns candidate data with responses
4. Recruiter approves/rejects candidates

---

## Security

### Current Implementation
- No authentication (assumes secure backend environment)
- CORS disabled (all origins allowed)

### Recommended for Production
1. **Add API Key Authentication**
   ```javascript
   app.use('/api/shortlist', validateApiKey);
   ```

2. **Enable CORS for Specific Origins**
   ```javascript
   app.use(cors({
     origin: ['https://your-vetted-app.com']
   }));
   ```

3. **Add Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   }));
   ```

4. **Deploy to Secure Server**
   - Use HTTPS
   - Set NODE_ENV=production
   - Store secrets in environment variables

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Database Schema Reference

### Congrats Tables Queried

- `audition_submissions` - Completed auditions
- `app_user` - User profiles
- `talent_profiles` - Extended candidate info
- `talent_skills` - Candidate skills
- `talent_experiences` - Work history
- `proctoring_snapshots` - Verification photos

---

## Deployment

### Option 1: VPS/Cloud Server
```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Clone repo and install
git clone <your-repo>
cd supabase-bridge-api
npm install

# Set up environment
cp .env.example .env
nano .env  # Add your keys

# Run with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name bridge-api
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

```bash
docker build -t bridge-api .
docker run -p 3000:3000 --env-file .env bridge-api
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### View Logs
```bash
# If using PM2
pm2 logs bridge-api

# If using Docker
docker logs <container-id>
```

---

## Troubleshooting

### Issue: "ECONNREFUSED" on startup
**Cause:** Port 3000 already in use
**Fix:** 
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Issue: "Invalid API key"
**Cause:** Wrong Supabase credentials in .env
**Fix:** Verify keys in Supabase Dashboard → Settings → API

### Issue: "No data returned"
**Cause:** Tables are empty or IDs don't match
**Fix:** 
1. Check `opportunity_id` exists in Congrats
2. Verify candidates have submitted auditions
3. Test database connection directly

---

## Development

### Project Structure
```
supabase-bridge-api/
├── index.js                    # Main API server
├── package.json                # Dependencies
├── .env                        # Environment variables (not in git)
├── SHORTLIST_API_DOCS.md      # Complete API docs
├── TOBI_QUICKSTART.md         # Quick start guide
├── test-shortlist-api.sh      # Test script
└── README.md                   # This file
```

### Adding New Endpoints

```javascript
// Example: Add new endpoint
app.get('/api/new-endpoint', async (req, res) => {
  try {
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      'table_name?select=*',
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Contributing

1. Create feature branch
2. Add tests
3. Update documentation
4. Submit pull request

---

## License

MIT

---

## Support

For questions or issues:
- Check `SHORTLIST_API_DOCS.md` for API details
- Check `TOBI_QUICKSTART.md` for integration guide
- Contact development team

---

## Changelog

### v1.0.0 (2025-01-15)
- ✨ Added Shortlist API endpoints
- ✨ Candidate detail endpoint with full profiles
- ✨ Review status update endpoint
- ✨ Project statistics endpoint
- 🐛 Fixed array validation for empty results
- 📚 Added comprehensive documentation
