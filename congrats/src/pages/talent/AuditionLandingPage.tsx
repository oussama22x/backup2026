import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SystemCheckStep } from "@/components/SystemCheckStep";
import { SystemCheckPreview } from "@/components/SystemCheckPreview";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock,
  Mic,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Upload,
  Video,
  Lock,
  Loader2,
  HelpCircle,
  Mail,
  Timer,
  HeadphonesIcon,
  Shield,
  FileText,
  User
} from "lucide-react";

// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Question {
  id: string;
  text: string;
  duration: number;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  questions: Question[];
}

export default function AuditionLandingPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
  const { profile } = useTalentProfile();

  // Determine where to navigate back to (jobs or opportunities)
  const getReturnPath = () => {
    const fromJobs = location.state?.fromJobs || document.referrer.includes('/jobs');
    return fromJobs ? '/jobs' : '/opportunities';
  };

  const [step, setStep] = useState<'welcome' | 'rules' | 'resume-upload' | 'system-check'>('welcome');
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  // Resume form state
  const [resumeName, setResumeName] = useState('');
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmittingResume, setIsSubmittingResume] = useState(false);

  // Auto-fill user data from profile and check for existing resume
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.id) return;

      // Auto-fill name and email from profile or auth
      const fullName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : '';

      setResumeName(fullName || '');
      setResumeEmail(currentUser.email || '');

      // Check if user has resume_url in app_user table
      try {
        const { data: appUser, error: dbError } = await supabase
          .from('app_user')
          .select('resume_url')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!dbError && appUser?.resume_url) {
          setHasResume(true);
          console.log('✅ User has resume in database:', appUser.resume_url);
          return;
        }

        // Fallback: check storage directly
        const { data: files, error: storageError } = await supabase.storage
          .from('resumes')
          .list(currentUser.id, {
            limit: 1,
          });

        if (!storageError && files && files.length > 0) {
          setHasResume(true);
          console.log('✅ User has resume in storage:', files[0].name);
        } else {
          console.log('ℹ️ No resume found for user');
        }
      } catch (error) {
        console.error('Error checking resume:', error);
      }
    };

    loadUserData();
  }, [currentUser?.id, currentUser?.email, profile]);

  // Fetch opportunity details
  useEffect(() => {
    const fetchOpportunity = async () => {
      if (!opportunityId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Set a timeout to show fallback data if API is slow
        const timeoutId = setTimeout(() => {
          console.warn('API timeout - using fallback data');
          setOpportunity({
            id: opportunityId,
            title: 'Position',
            company: 'Company',
            questions: []
          });
          setIsLoading(false);
        }, 2000); // 2 second timeout

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 5000); // 5 second abort

        const response = await fetch(`${BACKEND_URL}/api/vetted/jobs/${opportunityId}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearTimeout(fetchTimeout);

        if (response.ok) {
          const data = await response.json();
          setOpportunity({
            id: data.id,
            title: data.role_title || 'Position',
            company: data.company_name || 'Company',
            questions: data.questions || []
          });
        } else {
          throw new Error('Failed to fetch job details');
        }
      } catch (error) {
        console.error('Error fetching opportunity:', error);
        // Use fallback data
        setOpportunity({
          id: opportunityId,
          title: 'Position',
          company: 'Company',
          questions: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunity();
  }, [opportunityId]);

  const handleStartAudition = async (cameraStream: MediaStream | null) => {
    console.log("🎬 Starting audition with camera stream:", cameraStream);

    if (!opportunityId || !currentUser?.id) {
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
      console.log('🎯 Opportunity ID:', opportunityId);

      // First, get the full job details with questions from Vetted
      const jobResponse = await fetch(`${BACKEND_URL}/api/vetted/jobs/${opportunityId}`);

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
          opportunityId: opportunityId,
          questions: jobWithQuestions.questions || [],
        }),
      });

      const result = await startResponse.json();

      if (!startResponse.ok) {
        // If 409 Conflict, it means submission already exists - continue with it
        if (startResponse.status === 409 && result.existingSubmissionId) {
          console.log('⚠️ Submission already exists, continuing with existing submission:', result.existingSubmissionId);

          // Navigate to /opportunities (which has the audition UI) with existing submission
          navigate('/opportunities', {
            state: {
              autoStartOpportunityId: opportunityId,
              autoStartAudition: true,
              submissionId: result.existingSubmissionId,
              questions: jobWithQuestions.questions || [],
              cameraStream: cameraStream,
              fromJobs: location.state?.fromJobs
            }
          });
          return;
        }

        throw new Error(result.message || 'Failed to start audition');
      }

      console.log('✅ Audition started successfully');
      console.log('📝 Submission ID:', result.submissionId);
      console.log('📝 Questions received from backend:', result.questions?.length || 0);

      // Navigate to /opportunities (which has the audition UI) with state to start the audition
      // Always use /opportunities because it has AuditionQuestionScreen component
      // Use questions from backend response (includes fallback questions if needed)
      navigate('/opportunities', {
        state: {
          autoStartOpportunityId: opportunityId,
          autoStartAudition: true,
          submissionId: result.submissionId,
          questions: result.questions || [], // Use backend questions (includes fallback)
          cameraStream: cameraStream,
          fromJobs: location.state?.fromJobs
        }
      });

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
    } finally {
      setIsStarting(false);
    }
  };

  const handleGoBack = () => {
    navigate(getReturnPath());
  };

  const handleStartClick = () => {
    // Check if user has resume
    if (!hasResume) {
      // Switch to resume upload form
      setStep('resume-upload');
    } else {
      // Proceed directly to system check
      setStep('system-check');
    }
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!resumeName.trim() || !resumeEmail.trim() || !resumeFile || !consentChecked) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload your resume.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingResume(true);
      console.log('📤 Uploading resume to backend...');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('name', resumeName.trim());
      formData.append('email', resumeEmail.trim());
      formData.append('userId', currentUser.id);
      formData.append('consent', consentChecked.toString());

      if (opportunityId) {
        formData.append('opportunityId', opportunityId);
      }

      // Upload to backend
      const response = await fetch(`${BACKEND_URL}/api/profile/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload resume');
      }

      console.log('✅ Resume uploaded successfully:', result);

      // Save resume URL to app_user table
      if (result.resumeUrl) {
        const { error: updateError } = await supabase
          .from('app_user')
          .update({ resume_url: result.resumeUrl })
          .eq('id', currentUser.id);

        if (updateError) {
          console.error('⚠️ Failed to save resume URL to database:', updateError);
        } else {
          console.log('✅ Resume URL saved to database');
        }
      }

      // Mark resume as uploaded
      setHasResume(true);

      toast({
        title: "Resume Uploaded",
        description: "Your resume has been saved successfully.",
      });

      // Proceed to system check
      setStep('system-check');

    } catch (error) {
      console.error('❌ Resume upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading audition details...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find the audition you're looking for.
            </p>
            <Button onClick={handleGoBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 flex flex-col">
      {/* Header - Ultra Compact */}
      <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Back</span>
            </button>
            <div className="text-right">
              <h1 className="text-base md:text-lg font-bold leading-tight">
                {opportunity.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                at <span className="font-semibold text-foreground">{opportunity.company}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fixed Width Layout */}
      <main className="h-[calc(100vh-64px)] overflow-hidden">
        <div className="h-full flex gap-4 px-4 py-3">

          {/* LEFT SIDEBAR - Progress Sidebar - Fixed 250px */}
          <aside className="hidden lg:block w-[250px] flex-shrink-0">
            <Card className="h-full overflow-hidden flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                {/* Job Title */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold leading-tight">
                    {opportunity.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    at {opportunity.company}
                  </p>
                </div>

                {/* Application Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Application Progress</span>
                    <span className="text-xs font-bold text-primary">
                      {step === 'system-check' ? '75%' :
                        step === 'resume-upload' || hasResume ? '50%' :
                          step === 'rules' ? '25%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                      style={{
                        width: step === 'system-check' ? '80%' :
                          step === 'resume-upload' || hasResume ? '60%' :
                            step === 'rules' ? '40%' :
                              step === 'welcome' ? '20%' : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex-1 space-y-0">
                  {/* Step 0: Welcome */}
                  <div className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${step !== 'welcome'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-primary border-primary text-primary-foreground animate-pulse'
                        }`}>
                        {step !== 'welcome' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`w-0.5 h-12 ${step !== 'welcome' ? 'bg-green-500' : 'bg-primary'}`} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`text-sm font-semibold ${step !== 'welcome' ? 'text-green-600 dark:text-green-400' : 'text-primary'
                        }`}>
                        Welcome
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step !== 'welcome' ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                  </div>

                  {/* Step 1: Rules */}
                  <div className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${step === 'system-check' || step === 'resume-upload' || hasResume
                        ? 'bg-green-500 border-green-500 text-white'
                        : step === 'rules'
                          ? 'bg-primary border-primary text-primary-foreground animate-pulse'
                          : 'bg-muted border-border text-muted-foreground'
                        }`}>
                        {(step === 'system-check' || step === 'resume-upload' || hasResume) ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : step === 'rules' ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`w-0.5 h-12 ${(step === 'system-check' || step === 'resume-upload' || hasResume) ? 'bg-green-500' : step === 'rules' ? 'bg-primary' : 'bg-border'}`} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`text-sm font-semibold ${(step === 'system-check' || step === 'resume-upload' || hasResume) ? 'text-green-600 dark:text-green-400' :
                        step === 'rules' ? 'text-primary' :
                          'text-muted-foreground/50'
                        }`}>
                        Review Rules
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(step === 'system-check' || step === 'resume-upload' || hasResume) ? 'Completed' : step === 'rules' ? 'In Progress' : 'Next'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Upload Resume */}
                  <div className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${hasResume
                        ? 'bg-green-500 border-green-500 text-white'
                        : step === 'resume-upload'
                          ? 'bg-primary border-primary text-primary-foreground animate-pulse'
                          : 'bg-muted border-border text-muted-foreground'
                        }`}>
                        {hasResume ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <div className={`w-0.5 h-12 ${hasResume ? 'bg-green-500' : step === 'resume-upload' ? 'bg-primary' : 'bg-border'}`} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`text-sm font-semibold ${hasResume ? 'text-green-600 dark:text-green-400' :
                        step === 'resume-upload' ? 'text-primary' :
                          'text-muted-foreground/50'
                        }`}>
                        Upload Resume
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {hasResume ? 'Completed' : step === 'resume-upload' ? 'In Progress' : 'Required'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: System Check & Demo */}
                  <div className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${step === 'system-check'
                        ? 'bg-primary border-primary text-primary-foreground animate-pulse'
                        : hasResume || step === 'resume-upload'
                          ? 'bg-muted border-border text-muted-foreground'
                          : 'bg-muted/50 border-border text-muted-foreground/50'
                        }`}>
                        <Video className="h-5 w-5" />
                      </div>
                      <div className={`w-0.5 h-12 ${step === 'system-check' ? 'bg-primary' : 'bg-border'}`} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={`text-sm font-semibold ${step === 'system-check'
                        ? 'text-primary'
                        : hasResume || step === 'resume-upload'
                          ? 'text-foreground'
                          : 'text-muted-foreground/50'
                        }`}>
                        System Check
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step === 'system-check' ? 'In Progress' : hasResume || step === 'resume-upload' ? 'Next step' : 'Locked'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Audition */}
                  <div className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-muted/50 border-border text-muted-foreground/50 z-10">
                        <Lock className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-sm font-semibold text-muted-foreground/50">
                        Audition
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        Locked
                      </p>
                    </div>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="mt-auto pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Complete each step to proceed
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* CENTER COLUMN - Main Content - Flex-1 */}
          <section className="flex-1 overflow-hidden flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="flex-1 overflow-y-auto p-6">
                {step === 'welcome' ? (
                  // Welcome Step
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Welcome to Your Audition</h2>
                      <p className="text-muted-foreground">
                        A short, scenario-based audition designed to understand how you think through real challenges in this role.
                      </p>
                    </div>

                    <div className="border-t pt-6 space-y-6">
                      {/* What to Expect */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">What to Expect</h3>
                        <ul className="space-y-2 ml-5">
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>10 questions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>Audio-only</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>~3 minutes per answer</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>Realistic scenarios — take a moment, then walk us through your approach</span>
                          </li>
                        </ul>
                      </div>

                      {/* What We're Looking For */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">What We're Looking For</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Your responses help us understand how you work — specifically:
                        </p>
                        <ul className="space-y-2 ml-5">
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>how you break down a problem</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>how you prioritize and make trade-offs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>how you justify a recommendation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-medium text-primary mt-1">•</span>
                            <span>how you operate under real constraints (time, uncertainty, risk)</span>
                          </li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">
                          You don't need to have faced the exact scenario before.<br />
                          Just explain how you'd approach it.
                        </p>
                      </div>

                      {/* How You're Evaluated */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">How You're Evaluated</h3>
                        <p className="text-sm text-muted-foreground">
                          We use clear, role-specific criteria to ensure a consistent and fair assessment.<br />
                          We're evaluating your reasoning — not polish, accent, or delivery.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => setStep('rules')}
                        size="lg"
                        className="gap-2"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : step === 'rules' ? (
                  // Rules Step - Ultra Compact
                  <div className="space-y-2.5">
                    <div>
                      <h2 className="text-base font-bold mb-0.5 leading-tight">Start Your Audition</h2>
                      <p className="text-xs text-muted-foreground leading-tight">
                        Review the rules and checklist below
                      </p>
                    </div>

                    {/* Rules Section - Ultra Compact */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-primary" />
                        <h3 className="text-sm font-semibold">Rules</h3>
                      </div>
                      <div className="rounded border bg-muted/50 p-2">
                        <ul className="space-y-1">
                          <li className="flex items-start gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-[11px] leading-tight">
                              <strong>Duration:</strong> ~30 minutes
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <Mic className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <span className="text-[11px] leading-tight">
                              <strong>Audio only</strong> - No video required
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <div className="h-3 w-3 flex items-center justify-center text-muted-foreground mt-0.5 shrink-0">
                              <span className="text-[9px] font-bold">1</span>
                            </div>
                            <span className="text-[11px] leading-tight">
                              <strong>One at a time</strong> - Sequential questions
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <div className="h-3 w-3 flex items-center justify-center text-muted-foreground mt-0.5 shrink-0">
                              <span className="text-[10px]">⏸️</span>
                            </div>
                            <span className="text-[11px] leading-tight">
                              <strong>No pausing</strong> - Cannot restart
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Checklist Section - Ultra Compact */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <h3 className="text-sm font-semibold">Checklist</h3>
                      </div>
                      <div className="rounded border bg-primary/5 border-primary/20 p-2">
                        <p className="text-[10px] text-muted-foreground mb-1 leading-tight">
                          Before starting:
                        </p>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                              <div className="h-1 w-1 rounded-full bg-primary" />
                            </div>
                            <span className="text-[11px] font-medium leading-tight">Quiet place?</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                              <div className="h-1 w-1 rounded-full bg-primary" />
                            </div>
                            <span className="text-[11px] font-medium leading-tight">Microphone working?</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : step === 'resume-upload' ? (
                  // Resume Upload Form
                  <form onSubmit={handleResumeSubmit} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Complete Your Profile</h2>
                      <p className="text-sm text-muted-foreground">
                        Please provide your information and upload your resume to continue
                      </p>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={resumeName}
                        onChange={(e) => setResumeName(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={resumeEmail}
                        onChange={(e) => setResumeEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="resume" className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Resume / CV
                      </Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="hidden"
                          required
                        />
                        <label htmlFor="resume" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          {resumeFile ? (
                            <div>
                              <p className="text-sm font-medium text-primary">{resumeFile.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Click to change file
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium">Click to upload resume</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOC, or DOCX (Max 5MB)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="consent"
                        checked={consentChecked}
                        onCheckedChange={(checked) => setConsentChecked(checked === true)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="consent"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          I consent to store my data for future roles
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll keep your profile on file to match you with relevant opportunities
                        </p>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-3">
                      <div className="flex gap-2">
                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                            Your Privacy Matters
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                            Your information is encrypted and securely stored. You can request deletion at any time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : step === 'system-check' ? (
                  // System Check Preview
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">System Check</h2>
                      <p className="text-sm text-muted-foreground">
                        Test your camera and microphone before starting
                      </p>
                    </div>
                    <SystemCheckPreview onReady={(ready) => console.log('System ready:', ready)} />
                  </div>
                ) : null}
              </CardContent>

              {/* Button Footer */}
              {step === 'rules' ? (
                <div className="border-t p-4 bg-muted/20">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStartClick}
                  >
                    {hasResume ? 'Start Now' : 'Start Audition'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : step === 'resume-upload' ? (
                <div className="border-t p-4 bg-muted/20 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-32"
                    onClick={() => setStep('rules')}
                    disabled={isSubmittingResume}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    type="submit"
                    disabled={isSubmittingResume || !resumeName || !resumeEmail || !resumeFile || !consentChecked}
                    onClick={handleResumeSubmit}
                  >
                    {isSubmittingResume ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        Continue to System Check
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ) : step === 'system-check' ? (
                <div className="border-t p-4 bg-muted/20 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-32"
                    onClick={() => setStep('resume-upload')}
                    disabled={isStarting}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => handleStartAudition(null)}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        Start Audition
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </Card>
          </section>

          {/* RIGHT SIDEBAR - Instruction Panel - Fixed 250px */}
          <aside className="hidden lg:block w-[250px] flex-shrink-0">
            <Card className="h-full overflow-hidden flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                {/* Top Action Buttons */}
                <div className="flex gap-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => console.log('FAQ clicked')}
                  >
                    <HelpCircle className="h-3 w-3 mr-1.5" />
                    FAQ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => console.log('Contact Support clicked')}
                  >
                    <Mail className="h-3 w-3 mr-1.5" />
                    Support
                  </Button>
                </div>

                {/* Things to Know Section */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-4">Things to know before starting</h3>

                  <div className="space-y-4">
                    {/* Time Expectation */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Timer className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-xs font-medium leading-tight">
                          Expect to spend ~30 minutes
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          Complete all questions at your own pace
                        </p>
                      </div>
                    </div>

                    {/* Need Assistance */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <HeadphonesIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-xs font-medium leading-tight">
                          Need assistance? Just ask
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          Support is available if you need help
                        </p>
                      </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-xs font-medium leading-tight">
                          Your data is in your control
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          We respect your privacy and data
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action removed - button is in main content area */}

                {/* Resume Upload Step - Show helper message */}
                {step === 'resume-upload' && (
                  <div className="mt-auto pt-4 border-t">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3">
                      <p className="text-xs text-blue-900 dark:text-blue-100 text-center leading-relaxed">
                        <strong>Quick & Easy</strong><br />
                        This takes less than 2 minutes to complete
                      </p>
                    </div>
                  </div>
                )}

                {/* System Check Step - Show different message */}
                {step === 'system-check' && (
                  <div className="mt-auto pt-4 border-t">
                    <div className="rounded-lg bg-muted/50 p-3 mb-3">
                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        Review your camera and audio settings. Click "Start Audition" when ready.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
