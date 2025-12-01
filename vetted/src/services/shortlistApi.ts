/**
 * Shortlist API Service
 * Connects to Bridge API to fetch candidate audition data from Congrats database
 */

const BRIDGE_API_URL = import.meta.env.VITE_BRIDGE_API_URL || 'http://localhost:3000';

export interface CandidateResponse {
  question_number: number;
  question_text: string;
  audio_url: string;
  file_path: string;
  transcription: string | null;
  duration: number | null;
}

export interface Candidate {
  candidate_id: string;
  email: string;
  full_name: string | null;
  submission_id: string;
  submitted_at: string;
  status: string;
  duration_seconds: number | null;
  questions: string[];
  responses: CandidateResponse[];
  skills: string[];
  location: string | null;
  years_experience: number | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  availability_date: string | null;
  desired_role: string | null;
  github_url: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  proctoring_snapshots_count: number;
  ip_address: string | null;
  user_agent: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export interface ShortlistResponse {
  project_id: string;
  total_submissions: number;
  last_updated: string;
  candidates: Candidate[];
}

export interface CandidateDetail extends Candidate {
  profile: {
    full_name: string | null;
    location: string | null;
    years_experience: number | null;
    desired_salary_min: number | null;
    desired_salary_max: number | null;
    availability_date: string | null;
    desired_role: string | null;
    bio: string | null;
    github_url: string | null;
    resume_url: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
    phone: string | null;
  };
  experiences: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
  }>;
  proctoring: {
    total_snapshots: number;
    snapshots: Array<{
      snapshot_url: string;
      captured_at: string;
      metadata: any;
    }>;
  };
}

export interface ProjectStats {
  project_id: string;
  total_submissions: number;
  completed_submissions: number;
  in_progress: number;
  status_breakdown: Record<string, number>;
  average_duration_seconds: number;
  average_duration_minutes: number;
  completion_rate: string;
  last_submission: string | null;
}

/**
 * Get all candidates who submitted auditions for a project
 */
export async function getShortlist(projectId: string): Promise<ShortlistResponse> {
  const response = await fetch(`${BRIDGE_API_URL}/api/shortlist/${projectId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch shortlist: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get detailed information about a specific candidate
 */
export async function getCandidateDetails(
  projectId: string,
  candidateId: string
): Promise<CandidateDetail> {
  const response = await fetch(
    `${BRIDGE_API_URL}/api/shortlist/${projectId}/candidate/${candidateId}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch candidate details: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update review status for a candidate
 */
export async function updateReviewStatus(
  projectId: string,
  candidateId: string,
  status: 'approved' | 'rejected' | 'shortlisted',
  reviewerId: string,
  reviewerNotes?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${BRIDGE_API_URL}/api/shortlist/${projectId}/candidate/${candidateId}/review`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        reviewer_id: reviewerId,
        reviewer_notes: reviewerNotes,
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update review status: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  const response = await fetch(`${BRIDGE_API_URL}/api/shortlist/${projectId}/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch project stats: ${response.statusText}`);
  }
  
  return response.json();
}
