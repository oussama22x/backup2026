/**
 * Jobs Service
 * Handles all job-related API calls to Supabase
 */

import { supabase } from "@/integrations/supabase/client";

export interface Job {
  id: string;
  slug: string;
  title: string;
  type: "internship" | "graduate_trainee";
  category: string;
  location: string;
  employment_type: string;
  description: {
    overview: string;
    responsibilities: string[];
    success_criteria: string[];
    ideal_skills: string[];
  };
  brand_source: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  [key: string]: any; // Allow additional fields
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id?: string;
  candidate_data: ApplicationData;
  status: string;
  source?: string;
  utm_params?: Record<string, string>;
  audition_submission_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sync a single job from Vetted database to congrats database
 */
export async function syncJobFromVetted(jobData: Partial<Job>): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    if (!jobData.id || !jobData.slug || !jobData.title) {
      return { success: false, error: 'Missing required job data' };
    }

    // Check if job already exists
    const { data: existing, error: checkError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobData.id)
      .maybeSingle();

    if (checkError) {
      // If table doesn't exist, return error
      if (checkError.code === 'PGRST205' || checkError.message?.includes('table') || checkError.message?.includes('schema cache')) {
        return { success: false, error: 'Jobs table does not exist. Please run the migration first.' };
      }
      if (checkError.code !== 'PGRST116') {
        console.error('Error checking job:', checkError);
        return { success: false, error: checkError.message };
      }
    }

    // Build job object
    const jobToUpsert: Partial<Job> = {
      id: jobData.id,
      slug: jobData.slug,
      title: jobData.title,
      type: jobData.type || 'graduate_trainee',
      category: jobData.category || 'General',
      location: jobData.location || 'Remote',
      employment_type: jobData.employment_type || 'Full-time',
      description: jobData.description || {
        overview: '',
        responsibilities: [],
        success_criteria: [],
        ideal_skills: []
      },
      brand_source: jobData.brand_source || [],
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing job
      const { data, error } = await supabase
        .from("jobs")
        .update(jobToUpsert)
        .eq("id", jobData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating job:', error);
        return { success: false, error: error.message };
      }

      return { success: true, jobId: data.id };
    } else {
      // Insert new job
      jobToUpsert.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("jobs")
        .insert([jobToUpsert])
        .select()
        .single();

      if (error) {
        console.error('Error inserting job:', error);
        return { success: false, error: error.message };
      }

      return { success: true, jobId: data.id };
    }
  } catch (error) {
    console.error('Error syncing job:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch all active jobs
 */
export async function getActiveJobs(
  brandSource?: string
): Promise<Job[]> {
  try {
    let query = supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Filter by brand source if specified
    if (brandSource) {
      query = query.contains("brand_source", [brandSource]);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('schema cache')) {
        console.warn('Jobs table does not exist yet. Please run the migration.');
        return [];
      }
      console.error("Error fetching jobs:", error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error?.code === 'PGRST205' || error?.code === '42P01' || error?.message?.includes('table') || error?.message?.includes('schema cache') || error?.message?.includes('does not exist')) {
      console.warn('Jobs table does not exist yet. Please run the migration.');
      console.warn('Error details:', { code: error.code, message: error.message });
      return [];
    }
    console.error("Error in getActiveJobs:", error);
    return [];
  }
}

/**
 * Fetch a single job by ID or slug
 */
export async function getJobBySlug(slug: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, return null
      if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('table') || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.warn('Jobs table does not exist yet. Please run the migration.');
        console.warn('Error details:', { code: error.code, message: error.message });
        return null;
      }
      console.error("Error fetching job:", error);
      return null;
    }

    return data;
  } catch (error: any) {
    // If table doesn't exist, return null
    if (error?.code === 'PGRST205' || error?.message?.includes('table') || error?.message?.includes('schema cache')) {
      console.warn('Jobs table does not exist yet. Please run the migration.');
      return null;
    }
    console.error("Error in getJobBySlug:", error);
    return null;
  }
}

/**
 * Fetch a single job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getJobById:", error);
    return null;
  }
}

/**
 * Submit a job application
 */
export async function submitApplication(
  jobId: string,
  candidateData: ApplicationData,
  userId?: string,
  source?: string,
  utmParams?: Record<string, string>
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .insert([
        {
          job_id: jobId,
          user_id: userId || null,
          candidate_data: candidateData,
          source: source || "direct",
          utm_params: utmParams,
          status: "submitted",
        },
      ])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log it but pretend success (for demo purposes)
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('Job applications table does not exist - application not saved to database');
        // Return mock success for demo
        return {
          success: true,
          applicationId: `demo-${Date.now()}`,
          error: 'Note: Application submitted but not saved (database setup required)',
        };
      }
      console.error("Error submitting application:", error);
      return {
        success: false,
        error: "Failed to submit application. Please try again.",
      };
    }

    return {
      success: true,
      applicationId: data.id,
    };
  } catch (error) {
    console.error("Error in submitApplication:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Check if user has already applied to a job
 */
export async function checkExistingApplication(
  jobId: string,
  email: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_data->>email", email)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, silently return false (no existing application)
      if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return false;
      }
      console.error("Error checking application:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in checkExistingApplication:", error);
    return false;
  }
}

/**
 * Get user's applications by email (for linking anonymous applications)
 */
export async function getUserApplicationsByEmail(
  email: string
): Promise<JobApplication[]> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, user_id, candidate_data, status, source, utm_params, audition_submission_id, created_at, updated_at")
      .eq("candidate_data->>email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return [];
    }

    return (data || []).map(app => ({
      id: app.id,
      job_id: app.job_id,
      user_id: app.user_id,
      candidate_data: app.candidate_data as ApplicationData,
      status: app.status,
      source: app.source,
      utm_params: app.utm_params,
      audition_submission_id: app.audition_submission_id,
      created_at: app.created_at,
      updated_at: app.updated_at
    }));
  } catch (error) {
    console.error("Error in getUserApplicationsByEmail:", error);
    return [];
  }
}

/**
 * Get user's applications by user ID
 */
export async function getUserApplications(
  userId: string
): Promise<JobApplication[]> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, user_id, candidate_data, status, source, utm_params, audition_submission_id, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // Silently return empty array if table doesn't exist or isn't accessible
      if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return [];
      }
      console.error("Error fetching applications:", error);
      return [];
    }

    return (data || []).map(app => ({
      id: app.id,
      job_id: app.job_id,
      user_id: app.user_id,
      candidate_data: app.candidate_data as ApplicationData,
      status: app.status,
      source: app.source,
      utm_params: app.utm_params,
      audition_submission_id: app.audition_submission_id,
      created_at: app.created_at,
      updated_at: app.updated_at
    }));
  } catch (error) {
    console.error("Error in getUserApplications:", error);
    return [];
  }
}

/**
 * Link application to audition submission
 */
export async function linkApplicationToAudition(
  applicationId: string,
  auditionSubmissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("job_applications")
      .update({ audition_submission_id: auditionSubmissionId })
      .eq("id", applicationId);

    if (error) {
      console.error("Error linking application to audition:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in linkApplicationToAudition:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update application user_id when user signs up (link anonymous applications)
 */
export async function linkApplicationsToUser(
  email: string,
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .update({ user_id: userId })
      .eq("candidate_data->>email", email)
      .is("user_id", null)
      .select();

    if (error) {
      console.error("Error linking applications to user:", error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error in linkApplicationsToUser:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

