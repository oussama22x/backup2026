/**
 * Jobs Landing Page
 * - /jobs: Shows all jobs from Vetted database + vfaxapp-internal jobs
 * - /jobs/:orgSlug: Shows jobs from specific organization (Vetted database)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { syncJobFromVetted } from '@/services/jobsService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';

// Backend URL - includes all endpoints (bridge API merged)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface RoleDefinition {
  id: string;
  project_id: string;
  definition_data: {
    candidate_facing_jd: {
      role_title: string;
      company_name: string;
      location: string;
      job_summary: string;
      engagement_description: string;
      deliverables: string[];
      skills_and_requirements: string[];
      nice_to_have?: string[];
      compensation?: string;
      experience_level?: string;
      company_intro?: string;
      key_skills?: string[];
    };
  };
  created_at: string;
}

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  companySlug?: string;
  location: string;
  type: string;
  category: string;
  employment_type: string;
  description: {
    overview: string;
    responsibilities: string[];
    success_criteria: string[];
    ideal_skills: string[];
  };
  compensation?: string;
  experience_level?: string;
  company_intro?: string;
}

// Hardcoded VFA × APP jobs (previously in database)
const VFAXAPP_JOBS: Job[] = [
  {
    id: 'graduate-trainee-general',
    slug: 'graduate-trainee-general',
    title: 'Graduate Trainee (General Track)',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'General',
    employment_type: 'Full-time',
    description: {
      overview: 'Join our 8-week cross-functional graduate trainee program designed to give you hands-on experience across multiple departments. You will work on real projects, collaborate with experienced professionals, and build a strong foundation for your career.',
      responsibilities: [
        'Work on cross-functional projects across different departments',
        'Participate in team meetings and contribute ideas',
        'Complete assigned tasks and deliverables on time',
        'Learn and apply new skills in a fast-paced environment',
        'Collaborate with team members and stakeholders'
      ],
      success_criteria: [
        'Successfully complete all assigned projects',
        'Demonstrate strong learning agility and adaptability',
        'Show initiative and proactive problem-solving',
        'Build positive relationships with team members',
        'Deliver high-quality work consistently'
      ],
      ideal_skills: [
        'Strong communication skills',
        'Ability to work in a team',
        'Quick learner',
        'Problem-solving mindset',
        'Time management skills'
      ]
    }
  },
  {
    id: 'operations-trainee',
    slug: 'operations-trainee',
    title: 'Operations Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Operations',
    employment_type: 'Full-time',
    description: {
      overview: 'Support our operations team in planning and executing events, managing logistics, and ensuring smooth day-to-day operations. This role is perfect for someone who is organized, detail-oriented, and enjoys working behind the scenes to make things happen.',
      responsibilities: [
        'Assist with event planning and coordination',
        'Manage logistics and vendor relationships',
        'Support day-to-day operational tasks',
        'Maintain operational documentation',
        'Coordinate with different teams'
      ],
      success_criteria: [
        'Successfully support multiple events',
        'Maintain accurate documentation',
        'Build strong vendor relationships',
        'Improve operational efficiency',
        'Handle multiple tasks simultaneously'
      ],
      ideal_skills: [
        'Strong organizational skills',
        'Attention to detail',
        'Event planning experience',
        'Vendor management',
        'Project management'
      ]
    }
  },
  {
    id: 'marketing-trainee',
    slug: 'marketing-trainee',
    title: 'Marketing & Communications Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Marketing',
    employment_type: 'Full-time',
    description: {
      overview: 'Join our marketing team to create engaging content, manage social media, and help build our brand presence. This role is ideal for creative individuals who love storytelling and connecting with audiences.',
      responsibilities: [
        'Create and publish content across various channels',
        'Manage social media accounts and engagement',
        'Support marketing campaigns and initiatives',
        'Analyze marketing metrics and performance',
        'Collaborate with design and content teams'
      ],
      success_criteria: [
        'Increase social media engagement',
        'Create high-quality content consistently',
        'Support successful marketing campaigns',
        'Build brand awareness',
        'Generate creative ideas and concepts'
      ],
      ideal_skills: [
        'Content creation',
        'Social media management',
        'Creative writing',
        'Graphic design basics',
        'Analytics and reporting'
      ]
    }
  },
  {
    id: 'hr-trainee',
    slug: 'hr-trainee',
    title: 'HR & People Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Human Resources',
    employment_type: 'Full-time',
    description: {
      overview: 'Support our HR team in recruiting, onboarding, and people operations. This role is perfect for someone who is people-oriented and wants to help build a great workplace culture.',
      responsibilities: [
        'Assist with recruitment and candidate screening',
        'Support onboarding processes',
        'Help organize team events and activities',
        'Maintain HR documentation and records',
        'Support employee engagement initiatives'
      ],
      success_criteria: [
        'Successfully support recruitment processes',
        'Improve onboarding experience',
        'Contribute to team culture',
        'Maintain accurate HR records',
        'Support employee engagement'
      ],
      ideal_skills: [
        'Strong interpersonal skills',
        'Recruitment experience',
        'Event planning',
        'Documentation skills',
        'Cultural awareness'
      ]
    }
  },
  {
    id: 'product-tech-trainee',
    slug: 'product-tech-trainee',
    title: 'Product & Tech Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Product',
    employment_type: 'Full-time',
    description: {
      overview: 'Work with our product and tech teams to build and improve our platform. This role is ideal for those interested in product development, user experience, and technology.',
      responsibilities: [
        'Assist with product development tasks',
        'Support user research and testing',
        'Help with technical documentation',
        'Participate in product planning sessions',
        'Support bug fixes and improvements'
      ],
      success_criteria: [
        'Contribute to product improvements',
        'Support successful feature launches',
        'Improve user experience',
        'Learn technical skills',
        'Work effectively with tech team'
      ],
      ideal_skills: [
        'Technical aptitude',
        'Product thinking',
        'User research',
        'Problem-solving',
        'Collaboration skills'
      ]
    }
  },
  {
    id: 'events-community-trainee',
    slug: 'events-community-trainee',
    title: 'Events & Community Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Events',
    employment_type: 'Full-time',
    description: {
      overview: 'Help organize events and build our community. This role is perfect for outgoing individuals who love bringing people together and creating memorable experiences.',
      responsibilities: [
        'Plan and coordinate community events',
        'Engage with community members',
        'Support event logistics and execution',
        'Create event content and materials',
        'Build relationships with partners'
      ],
      success_criteria: [
        'Successfully organize multiple events',
        'Increase community engagement',
        'Build strong partner relationships',
        'Create memorable experiences',
        'Grow community participation'
      ],
      ideal_skills: [
        'Event planning',
        'Community management',
        'Networking',
        'Content creation',
        'Relationship building'
      ]
    }
  },
  {
    id: 'finance-admin-trainee',
    slug: 'finance-admin-trainee',
    title: 'Finance & Admin Trainee',
    company: 'VFA × APP',
    companySlug: 'vfaxapp-internal',
    location: 'Remote',
    type: 'graduate_trainee',
    category: 'Finance',
    employment_type: 'Full-time',
    description: {
      overview: 'Support our finance and admin operations. This role is ideal for detail-oriented individuals who enjoy working with numbers and ensuring smooth administrative processes.',
      responsibilities: [
        'Assist with budget tracking and reporting',
        'Support administrative tasks',
        'Help with financial documentation',
        'Coordinate with vendors and suppliers',
        'Maintain accurate records'
      ],
      success_criteria: [
        'Maintain accurate financial records',
        'Support budget management',
        'Improve administrative efficiency',
        'Handle multiple admin tasks',
        'Ensure compliance with processes'
      ],
      ideal_skills: [
        'Attention to detail',
        'Financial literacy',
        'Administrative skills',
        'Excel and spreadsheet skills',
        'Organization'
      ]
    }
  }
];

/**
 * Sync hardcoded vfaxapp jobs to database
 */
async function syncVfaxappJobsToDatabase() {
  for (const job of VFAXAPP_JOBS) {
    try {
      await syncJobFromVetted({
        id: job.id,
        slug: job.slug,
        title: job.title,
        type: job.type as 'graduate_trainee',
        category: job.category,
        location: job.location,
        employment_type: job.employment_type,
        description: job.description,
        brand_source: ['vfa', 'app'],
        is_active: true
      });
    } catch (error) {
      console.warn(`Failed to sync job ${job.id}:`, error);
      // Continue with other jobs
    }
  }
}

export default function Jobs() {
  const location = useLocation();
  const params = useParams<{ orgSlug?: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useCurrentUser();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Set<string>>(new Set());
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // Submission tracking
  const [userSubmissions, setUserSubmissions] = useState<Set<string>>(new Set());
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const orgSlug = params.orgSlug;

  useEffect(() => {
    loadJobs();
  }, [location.pathname, orgSlug]);

  // Fetch user's submissions to track applied jobs
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

        // Create a Set of job IDs the user has already applied to
        const appliedJobIds = new Set<string>(
          submissions.map((sub: any) => sub.opportunityId || sub.opportunity_id as string)
        );

        console.log('✅ User has applied to jobs:', Array.from(appliedJobIds));
        setUserSubmissions(appliedJobIds);
      } catch (err) {
        console.error('❌ Error fetching user submissions:', err);
        // Don't show error to user, just log it
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchUserSubmissions();
  }, [currentUser?.id]);

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

  // Helper function to extract skills from project data
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
          return skills.map((s: string) => s.replace(/[-•]\s*/, '').trim()).filter((s: string) => s.length > 0).slice(0, 8);
        }
      }
      return [];
    } catch {
      return [];
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Skip database sync to avoid errors - jobs are displayed from hardcoded data

      // Use hardcoded vfaxapp jobs for display
      const vfaxappJobsTransformed: Job[] = VFAXAPP_JOBS;

      // Fetch from Vetted database via backend
      // CHANGED: Fetching from /api/vetted/jobs instead of role-definitions to ensure all projects are visible
      const response = await fetch(`${BACKEND_URL}/api/vetted/jobs`);

      if (!response.ok) {
        throw new Error('Failed to fetch jobs from Vetted database');
      }

      const projects = await response.json();

      // Transform projects to jobs format
      const transformedJobs: Job[] = projects.map((project: any) => {
        const companyName = project.company_name || 'Company';
        const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const slug = (project.role_title || 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + '-' + project.id.substring(0, 8);

        const description = project.job_description || project.job_summary || '';

        return {
          id: project.id,
          slug: slug,
          title: project.role_title || 'Untitled Position',
          company: companyName,
          companySlug: companySlug,
          location: extractLocation(description),
          type: project.tier_name || 'Full-time', // Using tier_name as type proxy or default
          category: 'General', // Default category as we might not have it in project table
          employment_type: 'Full-time',
          description: {
            overview: description,
            responsibilities: [], // We might parse these if needed, but overview covers it for now
            success_criteria: [],
            ideal_skills: extractSkills(project)
          },
          compensation: extractCompensation(description),
          experience_level: 'Mid-Senior', // Default
          company_intro: ''
        };
      });

      // Sync Vetted jobs to congrats database (if user is authenticated)
      if (isAuthenticated && currentUser) {
        // Sync jobs in background (don't block UI)
        Promise.all(
          transformedJobs.map(async (job) => {
            try {
              await syncJobFromVetted({
                id: job.id,
                slug: job.slug,
                title: job.title,
                type: job.type as 'graduate_trainee',
                category: job.category,
                location: job.location,
                employment_type: job.employment_type,
                description: job.description,
                brand_source: [],
                is_active: true
              });
            } catch (error) {
              // Non-critical - continue syncing other jobs
              console.warn(`Failed to sync job ${job.id}:`, error);
            }
          })
        ).catch(err => {
          console.warn('Error syncing Vetted jobs to database:', err);
          // Non-critical - continue showing jobs even if sync fails
        });
      }

      // Combine vfaxapp and vetted jobs
      const allJobsCombined = [...vfaxappJobsTransformed, ...transformedJobs];

      // Filter by organization if orgSlug is provided
      let filteredJobs = allJobsCombined;
      if (orgSlug) {
        filteredJobs = allJobsCombined.filter(job => {
          const jobCompanySlug = job.companySlug ||
            job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return jobCompanySlug === orgSlug;
        });
        if (filteredJobs.length > 0) {
          setSelectedOrg(filteredJobs[0].company);
        }
      }

      // Extract unique organizations
      const orgs = new Set(
        allJobsCombined.map(job => job.company).filter(Boolean)
      );
      setOrganizations(orgs);
      setAllJobs(allJobsCombined);
      setJobs(filteredJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (job: Job) => {
    // For authenticated users, check if already applied
    if (isAuthenticated && currentUser?.id) {
      if (userSubmissions.has(job.id)) {
        toast({
          title: "Already Applied",
          description: "You have already submitted an application for this job.",
          variant: "destructive",
        });
        return;
      }
    }

    // Navigate to job detail page
    navigate(`/jobs/${job.companySlug || 'vfaxapp'}/${job.slug}`);
  };

  const handleOrgClick = (org: string) => {
    const orgSlugValue = org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    navigate(`/jobs/${orgSlugValue}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background py-24 px-6 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.3em] font-semibold text-primary">Opportunities</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
              {orgSlug ? selectedOrg || 'Organization Jobs' : 'Explore Opportunities'}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-2 font-medium">
              {orgSlug ? `Jobs at ${selectedOrg || orgSlug}` : 'Find your next role'}
            </p>
            <p className="text-base leading-relaxed text-muted-foreground max-w-3xl mx-auto">
              {orgSlug
                ? `Browse opportunities from ${selectedOrg || orgSlug}. Apply to roles that match your skills and career goals.`
                : "Discover exciting opportunities from leading organizations. Apply to roles that match your skills and career goals."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Organization Filter */}
        {!orgSlug && organizations.size > 0 && (
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            <button
              onClick={() => {
                setSelectedOrg(null);
                setJobs(allJobs);
                navigate('/jobs');
              }}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-smooth flex items-center gap-2 ${selectedOrg === null && !orgSlug
                ? 'bg-primary text-primary-foreground shadow-elegant'
                : 'bg-muted text-foreground hover:bg-accent'
                }`}
            >
              <Building2 className="w-4 h-4" />
              All Organizations ({organizations.size})
            </button>
            {Array.from(organizations).slice(0, 10).map(org => {
              const orgSlugValue = org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              const isActive = orgSlug === orgSlugValue || selectedOrg === org;
              return (
                <button
                  key={org}
                  onClick={() => handleOrgClick(org)}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-smooth flex items-center gap-2 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-elegant'
                    : 'bg-muted text-foreground hover:bg-accent'
                    }`}
                >
                  <Building2 className="w-4 h-4" />
                  {org}
                </button>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Error Loading Jobs
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadJobs}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        {!error && jobs.length === 0 && !loading && (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No opportunities available
            </h3>
            <p className="text-gray-500">
              Check back soon for new openings!
            </p>
          </div>
        )}

        {!error && jobs.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="glass-effect p-8 cursor-pointer border border-border/60 hover:border-primary/30 group transition-smooth"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                      {job.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                  </div>
                  {/* Applied Badge */}
                  {userSubmissions.has(job.id) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      ✓ Applied
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-muted-foreground" />
                    {job.location}
                  </div>
                  {job.experience_level && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {job.experience_level}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1 text-gray-400" />
                    {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {job.description.overview}
                </p>

                {/* Skills Section */}
                {job.description?.ideal_skills && job.description.ideal_skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {job.description.ideal_skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {job.compensation || 'Competitive compensation'}
                  </span>
                  <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-muted/30 border-t border-border/50 py-12 mt-24">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted-foreground">
          <p className="mb-3 text-base">
            Powered by <span className="font-semibold text-primary">VettedAI</span>
          </p>
          <p className="text-sm">
            Questions? Reach out to us at{' '}
            <a href="mailto:careers@venture4.africa" className="text-primary hover:underline font-medium">
              careers@venture4.africa
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

