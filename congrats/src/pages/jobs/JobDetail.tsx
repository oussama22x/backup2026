/**
 * Job Detail Page
 * Shows full job description and inline application form
 * Public page - no authentication required for viewing/application
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    getJobBySlug,
    getJobById,
    submitApplication,
    checkExistingApplication,
    syncJobFromVetted,
    linkApplicationsToUser,
    linkApplicationToAudition,
    Job,
    ApplicationData,
} from '@/services/jobsService';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Briefcase,
    CheckCircle,
    Sparkles,
    Loader2,
    FileCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { VFAXAPP_JOBS } from '@/constants/jobs';

// Backend URL - includes all endpoints (bridge API merged)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface VettedJobData {
    company_intro?: string;
    engagement_description?: string;
    deliverables?: string[];
    skills_and_requirements?: string[];
    nice_to_have?: string[];
    key_skills?: string[];
    compensation?: string;
    experience_level?: string;
    company_name?: string;
}

export default function JobDetail() {
    const { orgSlug, jobSlug } = useParams<{ orgSlug?: string; jobSlug?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, isAuthenticated } = useCurrentUser();
    const { profile } = useTalentProfile();

    const [job, setJob] = useState<Job | null>(null);
    const [vettedData, setVettedData] = useState<VettedJobData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [applicationId, setApplicationId] = useState<string | null>(null);

    const [formData, setFormData] = useState<ApplicationData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        resume_url: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    useEffect(() => {
        if (jobSlug) {
            loadJob(jobSlug);
        }
    }, [jobSlug]);

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (currentUser && profile && !formData.email) {
            setFormData(prev => ({
                ...prev,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: currentUser.email || '',
            }));
        }
    }, [currentUser, profile]);

    const loadJob = async (slug: string) => {
        setLoading(true);
        try {
            // First check hardcoded VFA×APP jobs
            const hardcodedJob = VFAXAPP_JOBS.find(j => j.slug === slug);

            let jobData: Job | null = null;

            if (hardcodedJob) {
                // Convert hardcoded job to Job format
                jobData = {
                    id: hardcodedJob.id,
                    slug: hardcodedJob.slug,
                    title: hardcodedJob.title,
                    type: hardcodedJob.type as 'graduate_trainee',
                    category: hardcodedJob.category,
                    location: hardcodedJob.location,
                    employment_type: hardcodedJob.employment_type,
                    description: hardcodedJob.description,
                    brand_source: ['vfa', 'app'],
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Sync hardcoded job to database so applications can reference it
                try {
                    await syncJobFromVetted(jobData);
                    console.log('✅ Hardcoded job synced to database:', jobData.slug);
                } catch (syncError) {
                    console.warn('⚠️ Could not sync hardcoded job to database:', syncError);
                }
            }

            // If not in hardcoded jobs, try database (silently fail if table doesn't exist)
            if (!jobData) {
                try {
                    jobData = await getJobBySlug(slug);
                } catch (dbError) {
                    // Silently ignore database errors
                    console.warn('Could not fetch from database:', dbError);
                }
            }

            // If still not found, try fetching from vetted database via backend
            if (!jobData) {
                const response = await fetch(`${BACKEND_URL}/api/vetted/role-definitions`);

                if (response.ok) {
                    const roleDefs = await response.json();
                    // Find job by matching slug
                    const roleDef = roleDefs.find((rd: any) => {
                        if (!rd.definition_data?.candidate_facing_jd) return false;
                        const jd = rd.definition_data.candidate_facing_jd;
                        const generatedSlug = jd.role_title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '') + '-' + rd.id.substring(0, 8);
                        return generatedSlug === slug;
                    });

                    if (roleDef) {
                        const jd = roleDef.definition_data.candidate_facing_jd;
                        // Store vetted-specific data for enhanced display
                        setVettedData({
                            company_intro: jd.company_intro,
                            engagement_description: jd.engagement_description,
                            deliverables: jd.deliverables,
                            skills_and_requirements: jd.skills_and_requirements,
                            nice_to_have: jd.nice_to_have,
                            key_skills: jd.key_skills,
                            compensation: jd.compensation,
                            experience_level: jd.experience_level,
                            company_name: jd.company_name
                        });
                        // Transform to Job format
                        jobData = {
                            id: roleDef.project_id || roleDef.id,
                            slug: slug,
                            title: jd.role_title,
                            type: 'graduate_trainee',
                            category: roleDef.definition_data?.context_flags?.role_family || 'General',
                            location: jd.location || 'Remote',
                            employment_type: 'Full-time',
                            description: {
                                overview: jd.job_summary || jd.engagement_description || '',
                                responsibilities: jd.deliverables || [],
                                success_criteria: jd.skills_and_requirements?.slice(0, 5) || [],
                                ideal_skills: jd.key_skills || []
                            },
                            brand_source: jd.company_name ? [jd.company_name.toLowerCase().replace(/\s+/g, '-')] : [],
                            is_active: true,
                            created_at: roleDef.created_at,
                            updated_at: roleDef.created_at
                        };

                        // Sync job to database so applications can reference it
                        try {
                            await syncJobFromVetted(jobData);
                            console.log('✅ Job synced to database:', jobData.slug);
                        } catch (syncError) {
                            console.warn('⚠️ Could not sync job to database:', syncError);
                            // Continue anyway - job data is still in memory
                        }
                    }
                }
            }

            setJob(jobData);
        } catch (error) {
            console.error('Error loading job:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (PDF, DOC, DOCX)
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];

            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, DOC, or DOCX file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setResumeFile(file);
            setError(null);
        }
    };

    const uploadResume = async (): Promise<string | null> => {
        if (!resumeFile) return null;

        setUploadingResume(true);
        try {
            // Use talent_files storage bucket
            const fileExt = resumeFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `resumes/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('talent-files')
                .upload(filePath, resumeFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('talent-files')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (err) {
            console.error('Error uploading resume:', err);
            return null;
        } finally {
            setUploadingResume(false);
        }
    };

    const validateForm = () => {
        if (!formData.first_name.trim()) {
            setError('Please enter your first name');
            return false;
        }
        if (!formData.last_name.trim()) {
            setError('Please enter your last name');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email address');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !job) return;

        setSubmitting(true);
        setError(null);

        try {
            // Redirect unauthenticated users to complete their profile
            if (!isAuthenticated || !currentUser) {
                // Store the job they're applying to for post-signup redirect
                localStorage.setItem('pendingJobApplication', JSON.stringify({
                    jobId: job.id,
                    jobSlug: job.slug,
                    orgSlug: orgSlug || 'vfaxapp',
                    jobTitle: job.title
                }));

                // Redirect to signup with context
                navigate('/signup', {
                    state: {
                        from: 'job-application',
                        jobTitle: job.title
                    }
                });
                return;
            }

            // Upload resume if provided (optional - continue even if upload fails)
            let resumeUrl = null;
            if (resumeFile) {
                resumeUrl = await uploadResume();
                if (!resumeUrl) {
                    console.warn('Resume upload failed, continuing without it');
                    // Don't block submission if resume upload fails
                }
            }

            // Prepare application data with resume URL
            const applicationData = {
                ...formData,
                resume_url: resumeUrl || '',
            };

            // Get source from URL params
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('source') || 'direct';
            const utmParams = {
                utm_source: urlParams.get('utm_source') || '',
                utm_campaign: urlParams.get('utm_campaign') || '',
                utm_medium: urlParams.get('utm_medium') || '',
            };

            // Submit application (with user_id if logged in, null if anonymous)
            const result = await submitApplication(
                job.id,
                applicationData,
                currentUser?.id,
                source,
                utmParams
            );

            if (result.success && result.applicationId) {
                setApplicationId(result.applicationId);
                setShowSuccess(true);

                // If user is logged in, link any previous anonymous applications with this email
                if (currentUser?.id) {
                    await linkApplicationsToUser(formData.email, currentUser.id);

                    // Check if user has an existing audition submission for this job and link it
                    try {
                        const { data: existingAudition } = await supabase
                            .from('audition_submissions')
                            .select('id')
                            .eq('user_id', currentUser.id)
                            .eq('opportunity_id', job.id)
                            .maybeSingle();

                        if (existingAudition) {
                            await linkApplicationToAudition(result.applicationId, existingAudition.id);
                        }
                    } catch (auditionError) {
                        console.warn('Error linking to existing audition:', auditionError);
                        // Non-critical, continue
                    }
                }

                // Reset form
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    resume_url: '',
                });
                setResumeFile(null);
            } else {
                setError(result.error || 'Failed to submit application. Please try again.');
            }
        } catch (err: any) {
            console.error('Error submitting application:', err);
            if (err?.code === '23503' || err?.message?.includes('foreign key') || err?.message?.includes('not present in table')) {
                setError('Job not found in database. Please refresh the page and try again.');
            } else {
                setError(err?.message || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeBadge = (type: string) => {
        const isInternship = type === 'internship';
        return (
            <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${isInternship
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-accent/10 text-accent border border-accent/30'
                    }`}
            >
                <Sparkles className="w-4 h-4 mr-2" />
                {isInternship ? 'Internship' : 'Graduate Trainee'}
            </span>
        );
    };

    const handleReturnHome = () => {
        // If user is logged in and profile completed, go to /jobs, else go to signup/profile wizard
        if (currentUser && profile?.onboarding_completed) {
            navigate('/jobs');
        } else if (currentUser) {
            navigate('/talent/profile/wizard');
        } else {
            navigate('/signup');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background pt-16">
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading job details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-16">
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
                        <p className="text-gray-600 mb-6">The position you're looking for doesn't exist.</p>
                        <button
                            onClick={() => {
                                if (orgSlug) {
                                    navigate(`/jobs/${orgSlug}`);
                                } else {
                                    navigate('/jobs');
                                }
                            }}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            View All Jobs
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success Modal
    if (showSuccess) {
        return (
            <div className="min-h-screen bg-background pt-16">
                <div className="flex items-center justify-center p-6 min-h-[calc(100vh-200px)]">
                    <div className="glass-effect p-8 md:p-12 max-w-2xl w-full text-center">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
                                🎉 Congratulations!
                            </h2>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                Your application has been submitted successfully!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    // Redirect to audition page using job ID
                                    if (job?.id) {
                                        navigate(`/audition/${job.id}/start`, {
                                            state: { fromJobs: true }
                                        });
                                    } else {
                                        navigate('/jobs');
                                    }
                                }}
                                className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-smooth shadow-elegant"
                            >
                                Proceed to Audition
                            </button>
                            <button
                                onClick={handleReturnHome}
                                className="w-full px-8 py-4 bg-card text-foreground rounded-xl font-medium hover:bg-accent transition-smooth border border-border"
                            >
                                Return to Home
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground mt-6">
                            We'll review your application and get back to you soon!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="pt-16">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 py-4">
                        <button
                            onClick={() => {
                                if (orgSlug) {
                                    navigate(`/jobs/${orgSlug}`);
                                } else {
                                    navigate('/jobs');
                                }
                            }}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Jobs
                        </button>
                    </div>
                </div>

                {/* Two-Column Layout: Job Description + Application Form */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Job Header - Full Width */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    {job.title}
                                </h1>
                                <div className="flex flex-wrap gap-4 text-gray-600">
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-5 h-5 mr-2 text-gray-400" />
                                        {job.employment_type}
                                    </div>
                                    <div className="flex items-center">
                                        <Briefcase className="w-5 h-5 mr-2 text-gray-400" />
                                        {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                                    </div>
                                </div>
                            </div>
                            <div>{getTypeBadge(job.type)}</div>
                        </div>
                    </div>

                    {/* Two-Column Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Job Description (2/3 width on desktop) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
                                {/* Company Intro (if from vetted) */}
                                {vettedData?.company_intro && (
                                    <section className="bg-gray-50 rounded-xl p-6 border-l-4 border-primary">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-2">
                                                    {vettedData.company_name || 'Company'}
                                                </h3>
                                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                    {vettedData.company_intro}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Engagement Description */}
                                {vettedData?.engagement_description ? (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            Engagement Description
                                        </h2>
                                        <div className="prose prose-gray max-w-none">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                                {vettedData.engagement_description}
                                            </p>
                                        </div>
                                    </section>
                                ) : (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Overview</h2>
                                        <p className="text-gray-700 leading-relaxed">{job.description.overview}</p>
                                    </section>
                                )}

                                {/* Deliverables */}
                                {(vettedData?.deliverables && vettedData.deliverables.length > 0) ? (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            Deliverables
                                        </h2>
                                        <ul className="space-y-2">
                                            {vettedData.deliverables.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ) : job.description.responsibilities.length > 0 && (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            What You'll Do
                                        </h2>
                                        <ul className="space-y-2">
                                            {job.description.responsibilities.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Skills and Requirements */}
                                {(vettedData?.skills_and_requirements && vettedData.skills_and_requirements.length > 0) ? (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            Skills and Requirements
                                        </h2>
                                        <ul className="space-y-2">
                                            {vettedData.skills_and_requirements.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ) : job.description.success_criteria.length > 0 && (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            Success Looks Like
                                        </h2>
                                        <ul className="space-y-2">
                                            {job.description.success_criteria.map((item, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Key Skills */}
                                {(vettedData?.key_skills && vettedData.key_skills.length > 0) && (
                                    <section>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                            Key Skills
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {vettedData.key_skills.map((skill, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Compensation & Location */}
                                {(vettedData?.compensation || vettedData?.experience_level) && (
                                    <section className="bg-gray-50 rounded-xl p-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {vettedData.compensation && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-1">💰 Compensation</h3>
                                                    <p className="text-gray-700">{vettedData.compensation}</p>
                                                </div>
                                            )}
                                            {vettedData.experience_level && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 mb-1">📍 Experience Level</h3>
                                                    <p className="text-gray-700">{vettedData.experience_level}</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Application Form (1/3 width on desktop, sticky) */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Apply Now
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Join Africa's next generation of leaders
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* First Name */}
                                    <div>
                                        <label htmlFor="first_name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="John"
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label htmlFor="last_name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="Doe"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Phone Number
                                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            placeholder="+234 XXX XXX XXXX"
                                        />
                                    </div>

                                    {/* Resume Upload */}
                                    <div>
                                        <label htmlFor="resume" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Resume / CV
                                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="resume"
                                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                onChange={handleFileChange}
                                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                            />
                                            {resumeFile && (
                                                <div className="mt-1.5 flex items-center text-xs text-primary">
                                                    <FileCheck className="w-3 h-3 mr-1.5" />
                                                    {resumeFile.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting || uploadingResume}
                                            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                                        >
                                            {uploadingResume ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : submitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Application'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

