import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Search,
  Zap,
  Handshake,
  CheckCircle2,
  Trash2,
  Briefcase,
  MapPin,
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";

// Backend URL for fetching opportunities
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

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
}

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
      key_skills?: string[];
    };
  };
}

const Index = () => {
  const { currentUser, isAuthenticated, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [topJobs, setTopJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    if (!loading && isAuthenticated && currentUser) {
      if (currentUser.role === "TALENT") {
        navigate("/jobs");
      } else if (currentUser.role === "RECRUITER") {
        navigate("/recruiter");
      } else if (currentUser.role === "PARTNER_VIEWER") {
        navigate("/partner");
      }
    }
  }, [isAuthenticated, currentUser, loading, navigate]);

  // Fetch top 3 jobs for preview
  useEffect(() => {
    const fetchTopJobs = async () => {
      try {
        setJobsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/vetted/role-definitions`);
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const roleDefs: RoleDefinition[] = await response.json();

        const transformedJobs: Job[] = roleDefs
          .filter((rd) => rd.definition_data?.candidate_facing_jd)
          .slice(0, 3)
          .map((rd) => {
            const jd = rd.definition_data.candidate_facing_jd;
            const companyName = jd.company_name || "Company";
            const companySlug = companyName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            const slug =
              jd.role_title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") +
              "-" +
              rd.id.substring(0, 8);

            return {
              id: rd.project_id || rd.id,
              slug: slug,
              title: jd.role_title,
              company: companyName,
              companySlug: companySlug,
              location: jd.location || "Remote",
              type: "graduate_trainee",
              category: "General",
              employment_type: "Full-time",
              description: {
                overview: jd.job_summary || jd.engagement_description || "",
                responsibilities: jd.deliverables || [],
                success_criteria: jd.skills_and_requirements?.slice(0, 5) || [],
                ideal_skills: jd.key_skills || [],
              },
            };
          });

        setTopJobs(transformedJobs);
      } catch (error) {
        console.error("Error fetching top jobs:", error);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchTopJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-subtle via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <Badge
                variant="secondary"
                className="mb-4 bg-primary/10 text-primary hover:bg-primary/20"
              >
                The New Standard for Hiring
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Don't just tell them you're good.{" "}
                <span className="text-primary">Prove it.</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                The resume is broken. VettedAI lets you skip keyword filters and
                showcase your actual skills through short, role-specific Auditions.
              </p>
              <p className="mb-8 text-base font-medium text-foreground">
                15 minutes of work. 10× the visibility.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate("/jobs")}
                  className="gap-2 text-lg"
                >
                  Explore Opportunities
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
           
            </motion.div>

            {/* Right: Audition Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Sample Audition Preview
                    </h3>
                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                      Skill Verified: 92/100
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Explain your approach to solving a complex problem",
                      "Describe a time you led a team through a challenge",
                      "Walk through your process for prioritizing tasks",
                    ].map((question, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Question {index + 1}
                          </span>
                        </div>
                        <p className="text-sm">{question}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Stop getting lost in the résumé black hole.
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Traditional hiring relies on documents that are easy to fake and
                bots that filter out qualified people.
              </p>
              <p className="mb-8 text-xl font-semibold">
                You are more than a PDF.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Fairer</h3>
                    <p className="text-sm text-muted-foreground">
                      Judged on your output, not your pedigree.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Faster</h3>
                    <p className="text-sm text-muted-foreground">
                      Skip intro calls—go straight to real work.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Verified</h3>
                    <p className="text-sm text-muted-foreground">
                      Build a portable "Talent Intelligence Matrix" that proves
                      your skills.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-8"
            >
              <img
                src="/resume.png"
                alt="Resume"
                className="h-48 w-48 object-contain"
              />
              <ArrowRight className="h-8 w-8 rotate-90 text-primary" />
              <img
                src="/audition.png"
                alt="Audition"
                className="h-48 w-48 object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Browse Opportunities",
                description:
                  "Explore roles from high-growth African startups and global companies looking for proven talent.",
                highlight: false,
              },
              {
                icon: Zap,
                title: "Take the Audition",
                description:
                  "A 15–30 minute, role-specific challenge. No accounts, no passwords — just show your work.",
                highlight: true,
              },
              {
                icon: Handshake,
                title: "Get Shortlisted",
                description:
                  "Your performance (the TI Matrix) goes straight to hiring managers. They see your strengths instantly.",
                highlight: false,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={`h-full transition-all hover:shadow-lg ${
                      step.highlight
                        ? "border-2 border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div
                        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                          step.highlight
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary-subtle text-primary"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Science Section */}
      <section className="border-t border-border bg-primary-subtle py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Backed by science, not AI hype.
            </h3>
            <p className="text-lg text-muted-foreground">
              VettedAI uses Work-Sample Testing — proven to be far more
              predictive of job success than resumes or unstructured interviews.
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              We measure Cognitive Ability, Execution, and Behavioral Judgement
              to give every candidate a fair, structured evaluation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Opportunity Preview Section */}
      <section className="border-t border-border bg-card py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Who is hiring on VettedAI?
            </h2>
            <p className="text-lg text-muted-foreground">
              Browse open roles from leading African startups, global companies,
              and fast growing teams.
            </p>
          </motion.div>

          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : topJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {topJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="mb-2 text-xl font-semibold">
                        {job.title}
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {job.company}
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.employment_type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const companySlug =
                            job.companySlug ||
                            job.company
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-+|-+$/g, "");
                          navigate(`/jobs/${companySlug}/${job.slug}`);
                        }}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>No opportunities available at the moment.</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/jobs")}
              className="gap-2"
            >
              Browse All Opportunities
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
