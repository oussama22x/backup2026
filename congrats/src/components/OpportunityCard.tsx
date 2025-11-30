import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign, CheckCircle2, Loader2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { OpportunityDetailsDialog } from "./OpportunityDetailsDialog";

interface OpportunityCardProps {
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  description?: string;
  skills: string[];
  hasApplied?: boolean;
  isCheckingStatus?: boolean;
}

export const OpportunityCard = ({ 
  opportunityId,
  title, 
  company, 
  location, 
  type, 
  rate,
  description = '',
  skills,
  hasApplied = false,
  isCheckingStatus = false,
}: OpportunityCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isDisabled = isCheckingStatus || hasApplied;
  
  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-gray-200 dark:border-gray-800">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">{company}</p>
            <h3 className="text-xl font-bold tracking-tight line-clamp-2">{title}</h3>
          </div>

          {/* Info Bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {location}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Briefcase className="h-3 w-3" />
              {type}
            </Badge>
          </div>

          {/* Compensation */}
          <div className="mb-4">
            <Badge variant="secondary" className="gap-1 text-xs">
              <DollarSign className="h-3 w-3" />
              {rate.length > 50 ? rate.substring(0, 50) + '...' : rate}
            </Badge>
          </div>

          {/* Skills List */}
          <div className="mb-6 flex-grow">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 6).map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 6 && (
                <span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  +{skills.length - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {hasApplied && (
            <div className="mb-4">
              <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3" />
                Applied
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowDetails(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            
            {hasApplied ? (
              <Button className="flex-1" size="sm" disabled variant="secondary">
                Applied
              </Button>
            ) : isCheckingStatus ? (
              <Button className="flex-1" size="sm" disabled variant="secondary">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Checking...
              </Button>
            ) : (
              <Link to={`/audition/${opportunityId}/start`} className="flex-1">
                <Button className="w-full" size="sm" disabled={isDisabled}>
                  Start Audition
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <OpportunityDetailsDialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        opportunityId={opportunityId}
        title={title}
        company={company}
        location={location}
        type={type}
        rate={rate}
        description={description}
        skills={skills}
        hasApplied={hasApplied}
      />
    </>
  );
};
