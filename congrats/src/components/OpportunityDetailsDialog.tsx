import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, X } from "lucide-react";
import { Link } from "react-router-dom";

interface OpportunityDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  description?: string;
  skills: string[];
  hasApplied?: boolean;
}

export const OpportunityDetailsDialog = ({
  isOpen,
  onClose,
  opportunityId,
  title,
  company,
  location,
  type,
  rate,
  description = '',
  skills,
  hasApplied = false,
}: OpportunityDetailsDialogProps) => {
  // Clean description with proper structure
  const cleanDescription = (desc: string): string => {
    if (!desc) return 'No description available.';
    
    return desc
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/_{2,}/g, '') // Remove underlines
      .replace(/^-{3,}$/gm, '') // Remove hr
      .replace(/^\s*[-•]\s*/gm, '• ') // Clean bullets
      .replace(/\n{3,}/g, '\n\n') // Clean spacing
      .trim();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-1">{title}</DialogTitle>
          <p className="text-lg text-muted-foreground">{company}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Details */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1.5 text-sm py-1.5 px-3">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-sm py-1.5 px-3">
              <Briefcase className="h-3.5 w-3.5" />
              {type}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-base font-semibold mb-3">Job Description</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
              {cleanDescription(description)}
            </div>
          </div>

          {/* Required Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {hasApplied ? (
              <Button className="flex-1" disabled variant="secondary">
                Already Applied
              </Button>
            ) : (
              <Link to={`/audition/${opportunityId}/start`} className="flex-1">
                <Button className="w-full">
                  Start Audition
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
