import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WizardProgress {
  incompleteSteps: number[];
  completedSteps: number[];
  totalSteps: number;
  progress: number;
  wizardProgress: number;
  vettingProgress: number;
  hasCompletedVetting: boolean;
  isLoading: boolean;
  error: Error | null;
}

const fetchWizardProgress = async (): Promise<Omit<WizardProgress, 'isLoading' | 'error'>> => {
  // TODO: Implement wizard progress tracking in the new database
  // For now, return default values to avoid CORS errors
  return {
    incompleteSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    completedSteps: [],
    totalSteps: 9,
    progress: 0,
    wizardProgress: 0,
    vettingProgress: 0,
    hasCompletedVetting: false,
  };
};

export const useWizardProgress = (): WizardProgress => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['wizard-progress'],
    queryFn: fetchWizardProgress,
    staleTime: 30000, // 30 seconds
  });

  return {
    incompleteSteps: data?.incompleteSteps || [],
    completedSteps: data?.completedSteps || [],
    totalSteps: data?.totalSteps || 9,
    progress: data?.progress || 0,
    wizardProgress: data?.wizardProgress || 0,
    vettingProgress: data?.vettingProgress || 0,
    hasCompletedVetting: data?.hasCompletedVetting || false,
    isLoading,
    error: error as Error | null,
  };
};
