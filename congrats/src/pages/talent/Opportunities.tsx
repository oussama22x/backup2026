import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { OpportunityCard } from "@/components/OpportunityCard";
import { AuditionStartModal } from "@/components/AuditionStartModal";
import { AuditionQuestionScreen } from "@/components/AuditionQuestionScreen";
import { AuditionCompleteScreen } from "@/components/AuditionCompleteScreen";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Backend URL - includes all endpoints (bridge API merged)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Question type with duration
interface Question {
  id: string;
  text: string;
  duration: number; // in seconds
}

// Opportunity type
interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  skills: string[];
  questions: Question[]; // Updated to use Question type
}

const Opportunities = () => {
  // Get current user
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Get URL params for auto-start
  const searchParams = new URLSearchParams(location.search);
  const autoStartOpportunityId = searchParams.get('autoStart');

  console.log('🌐 ========== OPPORTUNITIES PAGE LOADED ==========');
  console.log('🌐 URL location.search:', location.search);
  console.log('🌐 URL pathname:', location.pathname);
  console.log('🌐 autoStartOpportunityId from URL:', autoStartOpportunityId);
  console.log('🌐 Full location:', location);

  // State for opportunities data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to track user's submissions (prevent duplicate applications)
  const [userSubmissions, setUserSubmissions] = useState<Set<string>>(new Set());
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // State for loading indicator when starting audition
  const [isStarting, setIsStarting] = useState(false);

  // State for modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  // State for audition flow
  const [auditionInProgress, setAuditionInProgress] = useState(false);
  const [auditionComplete, setAuditionComplete] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Camera stream state
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  // Fetch opportunities from backend
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching jobs from Vetted database...');

        // Fetch jobs from Vetted database via backend
        const response = await fetch(`${BACKEND_URL}/api/vetted/jobs`);

        if (!response.ok) {
          throw new Error('Failed to fetch opportunities from Vetted');
        }

        const data = await response.json();
        console.log('✅ Received jobs from Vetted:', data.length);

        // Helper function to extract salary/rate from job description
        const extractCompensation = (jobDesc: string): string => {
          if (!jobDesc) return 'Competitive salary';
          const compensationMatch = jobDesc.match(/\$[\d,]+-\$[\d,]+\/month|\$[\d,]+\/month|\$[\d,]+k-\$[\d,]+k|Base salary: [^\n]+/i);
          if (compensationMatch) return compensationMatch[0];
          return 'Competitive compensation';
        };

        // Helper function to extract location from job description
        const extractLocation = (jobDesc: string): string => {
          if (!jobDesc) return 'Remote';
          if (/remote/i.test(jobDesc)) return 'Remote';
          const locationMatch = jobDesc.match(/Location:[^\n]+|📍[^\n]+/i);
          if (locationMatch) {
            return locationMatch[0].replace(/Location:|📍|\*\*/g, '').trim();
          }
          return 'Remote';
        };

        // Helper function to extract skills from role_definition
        const extractSkills = (project: any): string[] => {
          try {
            // Check if role_definition exists and has key_skills
            if (project.role_definition?.definition_data?.candidate_facing_jd?.key_skills) {
              return project.role_definition.definition_data.candidate_facing_jd.key_skills;
            }
            // Fallback: try to extract from job description
            const skillsSection = project.job_description?.match(/(?:Required Skills|Key Skills)[:\s]*([^#]+?)(?=###|##|$)/is);
            if (skillsSection && skillsSection[1]) {
              const skills = skillsSection[1].match(/[-•]\s*([^\n]+)/g);
              if (skills) {
                return skills.map(s => s.replace(/[-•]\s*/, '').trim()).filter(s => s.length > 0).slice(0, 8);
              }
            }
            return [];
          } catch {
            return [];
          }
        };

        // Transform Vetted projects into Congrats opportunities format
        const transformedData = data.map((project: any) => ({
          id: project.id,
          title: project.role_title || 'Untitled Position',
          company: project.company_name || 'Company',
          location: extractLocation(project.job_description),
          type: 'Full-time',
          rate: extractCompensation(project.job_description),
          description: project.job_description || project.job_summary || '',
          skills: extractSkills(project),
          questions: [], // Will be loaded when starting audition
        }));

        setOpportunities(transformedData);
        setError(null);
        console.log('✅ Transformed opportunities:', transformedData.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load opportunities';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [toast]);

  // Fetch user's submissions to check for duplicates
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      if (!currentUser?.id) {
        setSubmissionsLoading(false);
        return;
      }

      try {
        setSubmissionsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/submissions?userId=${currentUser.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch user submissions');
        }

        const result = await response.json();
        const submissions = result.data || result;

        // Create a Set of opportunity IDs the user has already applied to
        const appliedOpportunityIds = new Set<string>(
          submissions.map((sub: any) => sub.opportunityId || sub.opportunity_id as string)
        );

        console.log('✅ User has applied to opportunities:', Array.from(appliedOpportunityIds));
        console.log(`📊 Total applications: ${appliedOpportunityIds.size}`);
        setUserSubmissions(appliedOpportunityIds);
      } catch (err) {
        console.error('❌ Error fetching user submissions:', err);
        // Don't show error to user, just log it
        // Users can still see opportunities even if this fails
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchUserSubmissions();
  }, [currentUser?.id]);

  // Auto-start audition from landing page or after demo completion
  useEffect(() => {
    const locationState = location.state as any;
    console.log('🔍 Location state:', locationState);
    console.log('🔍 Checking auto-start:', { autoStartOpportunityId, opportunitiesLoaded: opportunities.length, isLoading, submissionsLoading });

    // Check if coming from audition landing page with state
    if (locationState?.autoStartAudition && locationState?.autoStartOpportunityId) {
      console.log('🎬 Auto-starting audition from landing page:', locationState.autoStartOpportunityId);

      // Try to find the opportunity in the list first
      let opportunity = opportunities.find(opp => opp.id === locationState.autoStartOpportunityId);

      // If not found in list, create a minimal opportunity object from state data
      // This handles the case when coming from /jobs where the opportunity might not be loaded yet
      if (!opportunity && locationState.questions) {
        console.log('⚠️ Opportunity not in list, creating from state data');
        opportunity = {
          id: locationState.autoStartOpportunityId,
          title: 'Position', // Will be updated when opportunities load
          company: 'Company',
          location: 'Remote',
          type: 'Full-time',
          rate: 'Competitive',
          skills: [],
          questions: [] // Will be set below
        };
      }

      if (opportunity) {
        console.log('✅ Found/created opportunity, starting audition with prepared data');

        // Set submission ID and questions if provided
        if (locationState.submissionId) {
          setSubmissionId(locationState.submissionId);
        }

        // Transform questions and set opportunity
        if (locationState.questions) {
          const transformedQuestions = locationState.questions.map((q: any, index: number) => ({
            id: q.question_id || q.id || `q${index + 1}`,
            text: q.text || q.question_text || q.prompt || '',
            duration: q.duration || q.time_limit_seconds || 120,
          }));

          setSelectedOpportunity({
            ...opportunity,
            questions: transformedQuestions,
          });
        } else {
          setSelectedOpportunity(opportunity);
        }

        // Set camera stream if provided
        if (locationState.cameraStream) {
          cameraStreamRef.current = locationState.cameraStream;
        }

        // Start the audition
        setAuditionInProgress(true);

        // Clear the state to prevent re-triggering
        navigate('/opportunities', { replace: true, state: {} });
        return;
      } else {
        console.log('❌ Cannot start audition: no opportunity data in state');
      }
    }

    // Wait for everything to be loaded before auto-starting from URL param
    if (autoStartOpportunityId && opportunities.length > 0 && !isLoading && !submissionsLoading) {
      console.log('🎬 Auto-starting audition for opportunity:', autoStartOpportunityId);

      // Find the opportunity
      const opportunity = opportunities.find(opp => opp.id === autoStartOpportunityId);

      if (opportunity) {
        console.log('✅ Found opportunity, starting audition:', opportunity.title);
        // Clear the URL param to prevent re-triggering
        navigate('/opportunities', { replace: true });

        // Start the audition
        handleStartAudition(opportunity);
      } else {
        console.log('❌ Opportunity not found:', autoStartOpportunityId);
      }
    }
  }, [autoStartOpportunityId, opportunities, isLoading, submissionsLoading, navigate, location.state]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        console.log("🧹 Cleaning up camera stream (component unmount)");
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  // Handler functions
  const handleStartAudition = (opportunity: Opportunity) => {
    console.log('🎯 handleStartAudition called for:', opportunity.id, opportunity.title);
    console.log('🎯 currentUser:', currentUser);
    console.log('🎯 submissionsLoading:', submissionsLoading);
    console.log('🎯 userSubmissions:', Array.from(userSubmissions));
    console.log('🎯 Has already applied?', userSubmissions.has(opportunity.id));

    // Check if user is authenticated
    if (!currentUser?.id) {
      console.log("❌ User not authenticated, redirecting to signup");
      toast({
        title: "Sign In Required",
        description: "Please create an account or sign in to apply for this opportunity.",
        variant: "default",
      });
      navigate(`/signup?redirect=/talent/opportunities?autoStart=${opportunity.id}`);
      return;
    }

    // Wait until submissions are loaded before allowing start
    if (submissionsLoading) {
      console.log("⚠️ Still checking submission status, please wait...");
      toast({
        title: "Please Wait",
        description: "Checking your application status...",
        variant: "default",
      });
      return;
    }

    // Check if user has already applied to this opportunity
    if (userSubmissions.has(opportunity.id)) {
      console.log("❌ Already applied to:", opportunity.title);
      toast({
        title: "Already Applied",
        description: "You have already submitted an audition for this opportunity.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ All checks passed, navigating to audition landing page for:', opportunity.title);
    navigate(`/audition/${opportunity.id}/start`);
  };

  const handleCloseModal = () => {
    setSelectedOpportunity(null);
    // Clean up camera if modal is closed without starting audition
    if (cameraStreamRef.current) {
      console.log("🧹 Cleaning up camera stream (modal closed)");
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const handleBeginAudition = async (cameraStream: MediaStream | null) => {
    console.log("🎬 Beginning audition with camera stream:", cameraStream);
    if (cameraStream) {
      console.log("Stream active:", cameraStream.active);
      console.log("Stream tracks:", cameraStream.getTracks());
      console.log("Video tracks:", cameraStream.getVideoTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      })));
    }
    cameraStreamRef.current = cameraStream;

    // Call the new /api/audition/start endpoint
    if (!selectedOpportunity || !currentUser?.id) {
      console.error('❌ Missing opportunity or user ID');
      toast({
        title: "Error",
        description: "Unable to start audition. Missing required information.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStarting(true);
      console.log('🚀 Fetching job details with questions from Vetted...');
      console.log('👤 User ID:', currentUser.id);
      console.log('🎯 Opportunity ID:', selectedOpportunity.id);

      // First, get the full job details with questions from Vetted
      const jobResponse = await fetch(`${BACKEND_URL}/api/vetted/jobs/${selectedOpportunity.id}`);

      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job details from Vetted');
      }

      const jobWithQuestions = await jobResponse.json();
      console.log('✅ Received job with questions:', jobWithQuestions.questions?.length || 0);

      // Now create a submission record in Congrats backend
      const startResponse = await fetch(`${BACKEND_URL}/api/audition/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          opportunityId: selectedOpportunity.id,
          questions: jobWithQuestions.questions || [], // Pass questions from Vetted
        }),
      });

      const result = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(result.message || 'Failed to start audition');
      }

      console.log('✅ Audition started successfully');
      console.log('📝 Submission ID:', result.submissionId);

      // Save submissionId
      setSubmissionId(result.submissionId);

      // Transform questions from Vetted format to frontend format
      const transformedQuestions = (jobWithQuestions.questions || []).map((q: any, index: number) => ({
        id: q.question_id || q.id || `q${index + 1}`,
        text: q.text || q.question_text || q.prompt || '',
        duration: q.duration || q.time_limit_seconds || 120,
      }));

      // Update selected opportunity with real questions from Vetted
      setSelectedOpportunity({
        ...selectedOpportunity,
        questions: transformedQuestions,
      });

      // Start the audition
      setAuditionInProgress(true);

    } catch (error) {
      console.error('❌ Error starting audition:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start audition. Please try again.",
        variant: "destructive",
      });

      // Clean up camera stream on error
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      cameraStreamRef.current = null;
    } finally {
      setIsStarting(false);
    }
  };

  // NEW: Handler when all questions are completed
  const handleQuestionsComplete = async () => {
    console.log('✅ All questions completed - creating submission record');

    // Clean up camera stream
    if (cameraStreamRef.current) {
      console.log("🧹 Cleaning up camera stream (audition complete)");
      cameraStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("🛑 Stopped camera track:", track.label);
      });
      cameraStreamRef.current = null;
    }

    if (!selectedOpportunity || !currentUser?.id) {
      console.error('❌ Missing opportunity or user ID');
      return;
    }

    try {
      console.log('📝 Calling create-submission endpoint...');
      console.log('👤 User ID:', currentUser.id);
      console.log('🎯 Opportunity ID:', selectedOpportunity.id);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/audition/create-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          opportunityId: selectedOpportunity.id,
          questions: selectedOpportunity.questions.map(q => ({
            question_text: q.text,
            time_limit_seconds: q.duration
          })),
          totalDuration: selectedOpportunity.questions.reduce((sum, q) => sum + q.duration, 0)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create submission');
      }

      const submissionId = result.data.submissionId;
      console.log('✅ Submission created with ID:', submissionId);
      console.log('✅ Submission saved to database - will appear in "My Applications"');
      setSubmissionId(submissionId);

      // Add this opportunity to the user's submissions set IMMEDIATELY
      if (selectedOpportunity?.id) {
        const opportunityId = selectedOpportunity.id;
        setUserSubmissions(prev => {
          const newSet = new Set([...prev, opportunityId]);
          console.log('📝 Updated applied list:', Array.from(newSet));
          console.log('🔍 Has this opportunity now?', newSet.has(opportunityId));
          return newSet;
        });
      }

      // Go directly to AuditionCompleteScreen (which has the survey built-in)
      setAuditionInProgress(false);
      setAuditionComplete(true);

    } catch (error) {
      console.error('❌ Error creating submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to proceed to survey. Please try again.",
        variant: "destructive",
      });
    }
  };

  // REMOVED: handleSurveyComplete - no longer needed since we skip AuditionSurveyScreen

  // OLD: Remove this function - no longer needed with per-question submission
  const handleCompleteAudition = async (answers: Blob[]) => {
    // This function is deprecated - keeping for reference only
    // New flow: Each answer is submitted individually via handleUploadAndAdvance
  };

  const handleReturnToDashboard = () => {
    // Clean up camera if still running
    if (cameraStreamRef.current) {
      console.log("🧹 Cleaning up camera stream (return to dashboard)");
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }

    setAuditionComplete(false);
    setSelectedOpportunity(null);

    // Redirect to the new Jobs component instead of staying on the old Opportunities page
    navigate('/jobs');
  };

  // If audition is complete, show completion screen (with built-in survey)
  if (auditionComplete) {
    return (
      <AuditionCompleteScreen
        onReturnToDashboard={handleReturnToDashboard}
        submissionId={submissionId || undefined}
      />
    );
  }

  // If audition is in progress, show the question screen
  if (auditionInProgress && selectedOpportunity && currentUser?.id) {
    return (
      <AuditionQuestionScreen
        questions={selectedOpportunity.questions}
        opportunityId={selectedOpportunity.id}
        userId={currentUser.id}
        submissionId={submissionId || undefined} // NEW: Pass submissionId
        cameraStream={cameraStreamRef.current}
        onComplete={handleQuestionsComplete}
      />
    );
  }

  // Otherwise, show the opportunities list
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Available Auditions</h1>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <h2 className="text-2xl text-muted-foreground">Loading opportunities...</h2>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-2xl text-destructive">Failed to load opportunities</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Retry
            </button>
          </div>
        )}

        {/* Opportunities Grid */}
        {!isLoading && !error && opportunities.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunityId={opportunity.id}
                title={opportunity.title}
                company={opportunity.company}
                location={opportunity.location}
                type={opportunity.type}
                rate={opportunity.rate}
                description={(opportunity as any).description}
                skills={opportunity.skills}
                hasApplied={userSubmissions.has(opportunity.id)}
                isCheckingStatus={submissionsLoading}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && opportunities.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <h2 className="text-2xl text-muted-foreground">No opportunities available at the moment</h2>
          </div>
        )}
      </div>

      {/* Audition Start Modal */}
      {selectedOpportunity && !auditionInProgress && (
        <AuditionStartModal
          opportunity={selectedOpportunity}
          onClose={handleCloseModal}
          onStart={handleBeginAudition}
          isStarting={isStarting}
        />
      )}
    </div>
  );
};

export default Opportunities;
