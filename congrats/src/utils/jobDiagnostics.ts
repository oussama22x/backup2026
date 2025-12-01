/**
 * Job Diagnostics Utility
 * Helps debug job syncing and application submission issues
 */

import { supabase } from "@/integrations/supabase/client";

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Check if jobs table exists and is accessible
 */
export async function checkJobsTable(): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id")
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('schema cache')) {
        return {
          success: false,
          message: "Jobs table does not exist. Please run the migration.",
          details: { code: error.code, message: error.message }
        };
      }
      return {
        success: false,
        message: `Error accessing jobs table: ${error.message}`,
        details: { code: error.code, message: error.message }
      };
    }
    
    return {
      success: true,
      message: "Jobs table exists and is accessible",
      details: { count: data?.length || 0 }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      details: error
    };
  }
}

/**
 * Check if job_applications table exists and is accessible
 */
export async function checkJobApplicationsTable(): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id")
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('table') || error.message?.includes('schema cache')) {
        return {
          success: false,
          message: "Job applications table does not exist. Please run the migration.",
          details: { code: error.code, message: error.message }
        };
      }
      return {
        success: false,
        message: `Error accessing job_applications table: ${error.message}`,
        details: { code: error.code, message: error.message }
      };
    }
    
    return {
      success: true,
      message: "Job applications table exists and is accessible",
      details: { count: data?.length || 0 }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      details: error
    };
  }
}

/**
 * Check if a specific job exists in the database
 */
export async function checkJobExists(jobId: string): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, slug")
      .eq("id", jobId)
      .maybeSingle();
    
    if (error) {
      return {
        success: false,
        message: `Error checking job: ${error.message}`,
        details: { code: error.code, message: error.message }
      };
    }
    
    if (!data) {
      return {
        success: false,
        message: `Job ${jobId} does not exist in database`,
        details: { jobId }
      };
    }
    
    return {
      success: true,
      message: `Job exists: ${data.title}`,
      details: data
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      details: error
    };
  }
}

/**
 * Test inserting a job (dry run - will be rolled back if transaction supported)
 */
export async function testJobInsert(jobData: {
  id: string;
  slug: string;
  title: string;
}): Promise<DiagnosticResult> {
  try {
    // Try to insert a test job
    const { data, error } = await supabase
      .from("jobs")
      .insert([{
        id: jobData.id,
        slug: jobData.slug,
        title: jobData.title,
        type: 'graduate_trainee',
        category: 'General',
        location: 'Remote',
        employment_type: 'Full-time',
        description: { overview: 'Test job' },
        brand_source: [],
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '42501') {
        return {
          success: false,
          message: "RLS policy violation: Permission denied. Check RLS policies.",
          details: { code: error.code, message: error.message }
        };
      }
      if (error.code === '23505') {
        return {
          success: true,
          message: "Job already exists (duplicate key - this is OK)",
          details: { code: error.code }
        };
      }
      return {
        success: false,
        message: `Error inserting job: ${error.message}`,
        details: { code: error.code, message: error.message }
      };
    }
    
    // If successful, try to delete it (cleanup)
    if (data) {
      await supabase.from("jobs").delete().eq("id", data.id);
    }
    
    return {
      success: true,
      message: "Job insert test successful",
      details: { jobId: data?.id }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      details: error
    };
  }
}

/**
 * Run all diagnostics
 */
export async function runAllDiagnostics(): Promise<{
  jobsTable: DiagnosticResult;
  applicationsTable: DiagnosticResult;
}> {
  const [jobsTable, applicationsTable] = await Promise.all([
    checkJobsTable(),
    checkJobApplicationsTable()
  ]);
  
  return {
    jobsTable,
    applicationsTable
  };
}

