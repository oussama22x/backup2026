import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Linkedin, 
  Globe,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronDown,
  Play,
  Camera
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  getShortlist, 
  getProjectStats, 
  updateReviewStatus,
  type Candidate,
  type ProjectStats 
} from "@/services/shortlistApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShortlistSectionProps {
  projectId: string;
}

export const ShortlistSection = ({ projectId }: ShortlistSectionProps) => {
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  // Fetch shortlist data
  const { 
    data: shortlistData, 
    isLoading: isLoadingShortlist,
    refetch: refetchShortlist 
  } = useQuery({
    queryKey: ['shortlist', projectId],
    queryFn: () => getShortlist(projectId),
    retry: 1,
  });

  // Fetch project stats
  const { data: statsData } = useQuery({
    queryKey: ['shortlist-stats', projectId],
    queryFn: () => getProjectStats(projectId),
    retry: 1,
  });

  const toggleCandidate = (candidateId: string) => {
    setExpandedCandidates(prev => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const handleReviewStatus = async (
    candidateId: string,
    status: 'approved' | 'rejected' | 'shortlisted'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to review candidates');
        return;
      }

      await updateReviewStatus(projectId, candidateId, status, user.id);
      toast.success(`Candidate ${status}`);
      refetchShortlist();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Failed to update candidate status');
    }
  };

  if (isLoadingShortlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Candidate Shortlist
          </CardTitle>
          <CardDescription>Loading candidates...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const candidates = shortlistData?.candidates || [];
  const totalCandidates = shortlistData?.total_submissions || 0;

  if (totalCandidates === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Candidate Shortlist
          </CardTitle>
          <CardDescription>No candidates have applied yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When candidates complete auditions for this job, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Submissions</CardDescription>
              <CardTitle className="text-3xl">{statsData.total_submissions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{statsData.completed_submissions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Duration</CardDescription>
              <CardTitle className="text-3xl">{statsData.average_duration_minutes}m</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">{statsData.completion_rate}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Candidates ({totalCandidates})
          </CardTitle>
          <CardDescription>
            Review candidate profiles and audition responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.candidate_id}
              candidate={candidate}
              isExpanded={expandedCandidates.has(candidate.candidate_id)}
              onToggle={() => toggleCandidate(candidate.candidate_id)}
              onReview={handleReviewStatus}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

interface CandidateCardProps {
  candidate: Candidate;
  isExpanded: boolean;
  onToggle: () => void;
  onReview: (candidateId: string, status: 'approved' | 'rejected' | 'shortlisted') => void;
}

const CandidateCard = ({ candidate, isExpanded, onToggle, onReview }: CandidateCardProps) => {
  const hasResponses = candidate.responses && candidate.responses.length > 0;
  
  const statusColors = {
    started: 'bg-blue-100 text-blue-800',
    submitted: 'bg-green-100 text-green-800',
    shortlisted: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    pending_technical_review: 'bg-purple-100 text-purple-800',
  };

  const statusLabels = {
    started: 'In Progress',
    submitted: 'Submitted',
    shortlisted: 'Shortlisted',
    approved: 'Approved',
    rejected: 'Rejected',
    pending_technical_review: 'Pending Review',
  };

  // Display name with fallback
  const displayName = candidate.full_name && candidate.full_name !== 'N/A' 
    ? candidate.full_name 
    : candidate.email 
    ? candidate.email 
    : `Candidate ${candidate.submission_id?.slice(0, 8) || 'Unknown'}`;

  const hasProfileData = candidate.email || (candidate.full_name && candidate.full_name !== 'N/A');

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                {displayName}
              </h3>
              <Badge className={statusColors[candidate.status as keyof typeof statusColors] || 'bg-gray-100'}>
                {statusLabels[candidate.status as keyof typeof statusLabels] || candidate.status}
              </Badge>
              {!hasProfileData && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Profile Incomplete
                </Badge>
              )}
            </div>
            {candidate.email ? (
              <p className="text-sm text-muted-foreground">{candidate.email}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No email provided yet</p>
            )}
            <p className="text-xs text-muted-foreground">
              Submission ID: {candidate.submission_id?.slice(0, 13)}...
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {candidate.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {candidate.location}
            </div>
          )}
          {candidate.years_experience !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {candidate.years_experience} years exp
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDistanceToNow(new Date(candidate.submitted_at), { addSuffix: true })}
          </div>
          {candidate.proctoring_snapshots_count > 0 && (
            <div className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {candidate.proctoring_snapshots_count} verification photos
            </div>
          )}
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill, idx) => (
              <Badge key={idx} variant="secondary">{skill}</Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {(candidate.status === 'submitted' || candidate.status === 'started' || candidate.status === 'pending_technical_review') && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(candidate.candidate_id || candidate.submission_id, 'shortlisted')}
              disabled={!candidate.candidate_id && !candidate.submission_id}
            >
              <Clock3 className="h-4 w-4 mr-1" />
              Shortlist
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(candidate.candidate_id || candidate.submission_id, 'approved')}
              className="text-green-600 hover:text-green-700"
              disabled={!candidate.candidate_id && !candidate.submission_id}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(candidate.candidate_id || candidate.submission_id, 'rejected')}
              className="text-red-600 hover:text-red-700"
              disabled={!candidate.candidate_id && !candidate.submission_id}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {/* Expanded Content */}
        <CollapsibleContent>
          <Separator className="my-4" />
          
          {/* Candidate Information Section */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-base">Candidate Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                <p className="text-sm font-medium">
                  {candidate.full_name && candidate.full_name !== 'N/A' 
                    ? candidate.full_name 
                    : <span className="italic text-muted-foreground">Not provided</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                <p className="text-sm font-medium">
                  {candidate.email || <span className="italic text-muted-foreground">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="text-sm font-medium">
                  {candidate.location || <span className="italic text-muted-foreground">Not provided</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Years of Experience</p>
                <p className="text-sm font-medium">
                  {candidate.years_experience !== null 
                    ? `${candidate.years_experience} years` 
                    : <span className="italic text-muted-foreground">Not provided</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Submission Status</p>
                <p className="text-sm font-medium capitalize">{candidate.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Time Spent</p>
                <p className="text-sm font-medium">
                  {candidate.duration_seconds 
                    ? `${Math.floor(candidate.duration_seconds / 60)} minutes` 
                    : <span className="italic text-muted-foreground">Not recorded</span>
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Rating Section - Coming Soon */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-base">Response Rating</h4>
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Rating Feature Coming Soon</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    The ability to rate and score candidate responses is currently in development. 
                    You'll be able to evaluate answers on multiple criteria including relevance, 
                    clarity, and technical accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          {(candidate.resume_url || candidate.linkedin_url || candidate.portfolio_url) && (
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-base">Links & Documents</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.resume_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      Resume
                    </a>
                  </Button>
                )}
                {candidate.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {candidate.portfolio_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-1" />
                      Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Responses */}
          {hasResponses ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-base">Audition Responses</h4>
              {candidate.responses.map((response) => (
                <div key={response.question_number} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        Question {response.question_number}
                      </Badge>
                      <p className="text-sm font-medium mb-2">{response.question_text}</p>
                    </div>
                    {response.duration && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.floor(response.duration / 60)}:{String(response.duration % 60).padStart(2, '0')}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Audio Player */}
                  {response.audio_url && (
                    <div className="bg-muted rounded p-3">
                      <audio controls className="w-full" preload="metadata">
                        <source src={response.audio_url} type="audio/mpeg" />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  
                  {/* Transcription */}
                  {response.transcription && (
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Transcription:</p>
                      <p className="text-sm">{response.transcription}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20">
              <p className="text-sm text-muted-foreground">
                No audio responses recorded yet. The candidate has started the audition but hasn't completed any recordings.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
