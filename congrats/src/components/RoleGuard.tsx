import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser, AppRole } from "@/hooks/useCurrentUser";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import { toast } from "sonner";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  requireProfileComplete?: boolean;
}

export function RoleGuard({ children, allowedRoles, requireProfileComplete = false }: RoleGuardProps) {
  const { currentUser, loading } = useCurrentUser();
  const { profile, isLoading: profileLoading } = useTalentProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!currentUser) {
        toast.error("Please sign in to access this page");
        navigate("/auth");
      } else if (!allowedRoles.includes(currentUser.role)) {
        toast.error("You don't have permission to access this page");
        navigate("/");
      } else if (requireProfileComplete && currentUser.role === "TALENT" && (!profile || !profile.onboarding_completed)) {
        toast.error("Please complete your profile to access this page");
        navigate("/talent/profile/wizard");
      }
    }
  }, [currentUser, loading, profileLoading, profile, allowedRoles, requireProfileComplete, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  if (requireProfileComplete && currentUser.role === "TALENT" && (!profile || !profile.onboarding_completed)) {
    return null;
  }

  return <>{children}</>;
}
