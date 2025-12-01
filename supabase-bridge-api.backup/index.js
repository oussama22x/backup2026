require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

// Supabase clients for admin operations
const supabaseB = createClient(
  process.env.SUPABASE_B_URL,
  process.env.SUPABASE_B_KEY
);

// Helper function for Supabase requests
const supabaseRequest = async (url, key, endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${url}/rest/v1/${endpoint}`, options);
  return response.json();
};

// ============ VETTED -> CONGRATS (Job Offers & Questions) ============

// Get all job offers from Vetted that requested "vetted network" (for Congrats dashboard)
app.get('/api/vetted/jobs', async (req, res) => {
  try {
    // Get all active jobs from Vetted (filter by candidate_source if you want only vetted_network)
    const data = await supabaseRequest(
      process.env.SUPABASE_A_URL,
      process.env.SUPABASE_A_KEY,
      'projects?select=*&status=neq.draft&limit=50',
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all role definitions from Vetted
app.get('/api/vetted/role-definitions', async (req, res) => {
  try {
    const data = await supabaseRequest(
      process.env.SUPABASE_A_URL,
      process.env.SUPABASE_A_KEY,
      'role_definitions?select=*&limit=50',
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific job with ALL details and AI-generated questions from Vetted
app.get('/api/vetted/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get project details
    const projectData = await supabaseRequest(
      process.env.SUPABASE_A_URL,
      process.env.SUPABASE_A_KEY,
      `projects?id=eq.${id}&select=*`,
      'GET'
    );
    
    if (!projectData || projectData.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const project = projectData[0];
    
    // Get role definition for this project
    const roleDefData = await supabaseRequest(
      process.env.SUPABASE_A_URL,
      process.env.SUPABASE_A_KEY,
      `role_definitions?project_id=eq.${id}&select=*`,
      'GET'
    );
    
    // Get audition scaffold (contains AI-generated questions)
    let questions = [];
    if (roleDefData && roleDefData.length > 0) {
      const roleDefId = roleDefData[0].id;
      const scaffoldData = await supabaseRequest(
        process.env.SUPABASE_A_URL,
        process.env.SUPABASE_A_KEY,
        `audition_scaffolds?role_definition_id=eq.${roleDefId}&select=*&order=created_at.desc&limit=1`,
        'GET'
      );
      
      if (scaffoldData && scaffoldData.length > 0) {
        // Extract questions from scaffold_data JSONB
        questions = scaffoldData[0].scaffold_data?.questions || [];
      }
    }
    
    // Combine everything
    const response = {
      ...project,
      role_definition: roleDefData[0] || null,
      questions: questions
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONGRATS -> VETTED (Applications & Exam Results) ============

// Create application in Congrats when candidate applies
app.post('/api/congrats/applications', async (req, res) => {
  try {
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      'congrat_test',
      'POST',
      req.body
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications from Congrats (for Vetted to see who applied)
app.get('/api/congrats/applications', async (req, res) => {
  try {
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      'congrat_test?select=*',
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications for specific job
app.get('/api/congrats/applications/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `congrat_test?job_id=eq.${jobId}&select=*`,
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status/exam results in Congrats
app.put('/api/congrats/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `congrat_test?id=eq.${id}`,
      'PATCH',
      req.body
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ VETTED SHORTLIST API (Pull Audition Data from Congrats) ============

/**
 * GET /api/shortlist/:projectId
 * Get completed audition submissions for a specific Vetted project
 * Returns: Array of candidates with their audition data, scores, and metadata
 */
app.get('/api/shortlist/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 1. Get all submissions for this opportunity (project)
    // Note: Showing all submissions regardless of status (started, submitted, etc.)
    const submissions = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `audition_submissions?opportunity_id=eq.${projectId}&select=*&order=submitted_at.desc`,
      'GET'
    );
    
    // Check if submissions is a valid array
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.json({
        project_id: projectId,
        total_submissions: 0,
        candidates: []
      });
    }
    
    // 2. Get user details for each submission
    const userIds = [...new Set(submissions.map(s => s.user_id))];
    
    // Fetch auth emails using admin API
    console.log('[DEBUG] Fetching auth users for IDs:', userIds);
    const authUsersMap = {};
    for (const userId of userIds) {
      try {
        console.log('[DEBUG] Fetching user:', userId);
        const { data, error } = await supabaseB.auth.admin.getUserById(userId);
        console.log('[DEBUG] Result for', userId, '- Data:', data, 'Error:', error);
        if (!error && data?.user) {
          authUsersMap[userId] = {
            email: data.user.email,
            created_at: data.user.created_at
          };
          console.log('[DEBUG] Stored email for', userId, ':', data.user.email);
        }
      } catch (err) {
        console.error(`[DEBUG] Exception fetching user ${userId}:`, err);
      }
    }
    console.log('[DEBUG] Final authUsersMap:', authUsersMap);
    
    // Get app_user data (may be empty)
    const users = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `app_user?id=in.(${userIds.join(',')})&select=*`,
      'GET'
    );
    
    // 3. Get talent profiles (extended info)
    const profiles = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `talent_profiles?user_id=in.(${userIds.join(',')})&select=*`,
      'GET'
    );
    
    // 4. Get skills for each user
    const skills = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `talent_skills?user_id=in.(${userIds.join(',')})&select=*`,
      'GET'
    );
    
    // 5. Get proctoring snapshots count for each submission
    const submissionIds = submissions.map(s => s.id);
    const proctoringCounts = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `proctoring_snapshots?submission_id=in.(${submissionIds.join(',')})&select=submission_id`,
      'GET'
    );
    
    // 6. Build comprehensive candidate profiles
    const candidates = submissions.map(submission => {
      const authUser = authUsersMap[submission.user_id];
      const user = users.find(u => u.id === submission.user_id);
      const profile = profiles.find(p => p.user_id === submission.user_id);
      const userSkills = skills.filter(s => s.user_id === submission.user_id);
      const snapshotCount = proctoringCounts.filter(p => p.submission_id === submission.id).length;
      
      // Parse questions and audio_urls from JSONB
      const questions = submission.questions || [];
      const audioUrls = submission.audio_urls || [];
      
      return {
        // Candidate Identity
        candidate_id: submission.user_id,
        email: authUser?.email || user?.email || null,
        full_name: profile?.full_name || null,
        
        // Submission Info
        submission_id: submission.id,
        submitted_at: submission.submitted_at,
        status: submission.status,
        duration_seconds: submission.duration_seconds,
        
        // Audition Data
        questions: questions,
        responses: audioUrls.map((audio, index) => ({
          question_number: index + 1,
          question_text: questions[index] || 'N/A',
          audio_url: audio.audio_url || audio.url,
          file_path: audio.file_path,
          transcription: audio.transcription || null,
          duration: audio.duration || null
        })),
        
        // Candidate Profile
        skills: userSkills.map(s => s.skill_name),
        location: profile?.location || null,
        years_experience: profile?.years_experience || null,
        resume_url: profile?.resume_url || null,
        linkedin_url: profile?.linkedin_url || null,
        portfolio_url: profile?.portfolio_url || null,
        
        // Verification Metrics
        proctoring_snapshots_count: snapshotCount,
        ip_address: submission.ip_address,
        user_agent: submission.user_agent,
        
        // Review Status
        reviewed_at: submission.reviewed_at,
        reviewer_id: submission.reviewer_id
      };
    });
    
    res.json({
      project_id: projectId,
      total_submissions: candidates.length,
      last_updated: new Date().toISOString(),
      candidates: candidates
    });
    
  } catch (error) {
    console.error('Error fetching shortlist:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shortlist/:projectId/candidate/:candidateId
 * Get detailed audition data for a specific candidate
 * Includes: Full responses, transcriptions, proctoring snapshots
 */
app.get('/api/shortlist/:projectId/candidate/:candidateId', async (req, res) => {
  try {
    const { projectId, candidateId } = req.params;
    
    // 1. Get submission
    const submissions = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `audition_submissions?opportunity_id=eq.${projectId}&user_id=eq.${candidateId}&select=*`,
      'GET'
    );
    
    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submission = submissions[0];
    
    // 2. Get user info
    const users = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `app_user?id=eq.${candidateId}&select=*`,
      'GET'
    );
    
    // 3. Get talent profile
    const profiles = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `talent_profiles?user_id=eq.${candidateId}&select=*`,
      'GET'
    );
    
    // 4. Get skills
    const skills = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `talent_skills?user_id=eq.${candidateId}&select=*`,
      'GET'
    );
    
    // 5. Get experiences
    const experiences = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `talent_experiences?user_id=eq.${candidateId}&select=*&order=start_date.desc`,
      'GET'
    );
    
    // 6. Get ALL proctoring snapshots with metadata
    const snapshots = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `proctoring_snapshots?submission_id=eq.${submission.id}&select=*&order=captured_at.asc`,
      'GET'
    );
    
    const user = users[0];
    const profile = profiles[0];
    
    res.json({
      // Identity
      candidate_id: candidateId,
      email: user?.email,
      full_name: profile?.full_name,
      
      // Submission
      submission_id: submission.id,
      submitted_at: submission.submitted_at,
      status: submission.status,
      duration_seconds: submission.duration_seconds,
      
      // Responses with full transcriptions
      responses: (submission.audio_urls || []).map((audio, index) => ({
        question_number: index + 1,
        question_text: (submission.questions || [])[index],
        audio_url: audio.audio_url || audio.url,
        file_path: audio.file_path,
        transcription: audio.transcription,
        duration: audio.duration
      })),
      
      // Full Profile
      profile: {
        full_name: profile?.full_name,
        location: profile?.location,
        years_experience: profile?.years_experience,
        bio: profile?.bio,
        resume_url: profile?.resume_url,
        linkedin_url: profile?.linkedin_url,
        portfolio_url: profile?.portfolio_url,
        phone: profile?.phone
      },
      
      // Skills
      skills: skills.map(s => s.skill_name),
      
      // Work History
      experiences: experiences.map(exp => ({
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date,
        end_date: exp.end_date,
        is_current: exp.is_current,
        description: exp.description
      })),
      
      // Proctoring Data
      proctoring: {
        total_snapshots: snapshots.length,
        snapshots: snapshots.map(snap => ({
          snapshot_url: snap.snapshot_url,
          captured_at: snap.captured_at,
          metadata: snap.metadata
        }))
      },
      
      // Metadata
      ip_address: submission.ip_address,
      user_agent: submission.user_agent,
      reviewed_at: submission.reviewed_at,
      reviewer_id: submission.reviewer_id
    });
    
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/shortlist/:projectId/candidate/:candidateId/review
 * Update review status for a candidate's submission
 * Body: { status: 'approved' | 'rejected', reviewer_notes: 'optional notes' }
 */
app.put('/api/shortlist/:projectId/candidate/:candidateId/review', async (req, res) => {
  try {
    const { projectId, candidateId } = req.params;
    const { status, reviewer_notes, reviewer_id } = req.body;
    
    if (!status || !['approved', 'rejected', 'shortlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or shortlisted' });
    }
    
    // Update submission status
    const data = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `audition_submissions?opportunity_id=eq.${projectId}&user_id=eq.${candidateId}`,
      'PATCH',
      {
        status: status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewer_id || null
      }
    );
    
    res.json({
      success: true,
      message: `Candidate ${status}`,
      data: data
    });
    
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shortlist/:projectId/stats
 * Get statistics for a project's shortlist
 * Returns: Total submissions, status breakdown, average completion time, etc.
 */
app.get('/api/shortlist/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get all submissions
    const submissions = await supabaseRequest(
      process.env.SUPABASE_B_URL,
      process.env.SUPABASE_B_KEY,
      `audition_submissions?opportunity_id=eq.${projectId}&select=*`,
      'GET'
    );
    
    // Check if submissions is a valid array
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.json({
        project_id: projectId,
        total_submissions: 0,
        completed_submissions: 0,
        in_progress: 0,
        status_breakdown: {},
        average_duration_seconds: 0,
        average_duration_minutes: 0,
        completion_rate: '0%',
        last_submission: null
      });
    }
    
    // Calculate stats
    const statusBreakdown = submissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});
    
    const completedSubmissions = submissions.filter(s => s.status !== 'in_progress');
    const averageDuration = completedSubmissions.length > 0 
      ? completedSubmissions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completedSubmissions.length
      : 0;
    
    res.json({
      project_id: projectId,
      total_submissions: submissions.length,
      completed_submissions: completedSubmissions.length,
      in_progress: submissions.filter(s => s.status === 'in_progress').length,
      status_breakdown: statusBreakdown,
      average_duration_seconds: Math.round(averageDuration) || 0,
      average_duration_minutes: Math.round(averageDuration / 60) || 0,
      completion_rate: ((completedSubmissions.length / submissions.length) * 100).toFixed(2) + '%',
      last_submission: submissions[0]?.submitted_at || null
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ LEGACY ENDPOINTS (keep for backwards compatibility) ============
app.get('/api/read', async (req, res) => {
  try {
    const data = await supabaseRequest(
      process.env.SUPABASE_A_URL,
      process.env.SUPABASE_A_KEY,
      'vetted_test?select=*',
      'GET'
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bridge API running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/vetted/jobs - Get all jobs from Vetted`);
  console.log(`  GET  /api/vetted/jobs/:id - Get job details with questions`);
  console.log(`  GET  /api/vetted/role-definitions - Get all role definitions from Vetted`);
  console.log(`  GET  /api/shortlist/:projectId - Get all candidates for a project`);
  console.log(`  GET  /api/shortlist/:projectId/candidate/:candidateId - Get detailed candidate data`);
  console.log(`  PUT  /api/shortlist/:projectId/candidate/:candidateId/review - Update review status`);
  console.log(`  GET  /api/shortlist/:projectId/stats - Get project statistics`);
});
