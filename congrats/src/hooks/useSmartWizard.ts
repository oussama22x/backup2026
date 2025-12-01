import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SmartWizardState {
  incompleteSteps: number[];
  completedSteps: number[];
  currentStepIndex: number;
  currentWizardStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalIncomplete: number;
  totalSteps: number;
  progress: number;
  goToNext: () => void;
  goToPrevious: () => void;
  markStepComplete: (step: number) => void;
  isLoading: boolean;
  error: Error | null;
}

export const useSmartWizard = (): SmartWizardState => {
  const [incompleteSteps, setIncompleteSteps] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [totalSteps, setTotalSteps] = useState(9);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIncompleteSteps = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement wizard progress tracking in the new database
      // For now, start from step 1 to avoid CORS errors from missing Edge Function
      setIncompleteSteps([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      setCompletedSteps([]);
      setTotalSteps(9);
      
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      console.error('Error fetching incomplete steps:', err);
      // On error, default to step 1 so user can still proceed
      setIncompleteSteps([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      setCompletedSteps([]);
      setTotalSteps(9);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncompleteSteps();
  }, []);

  const currentWizardStep = incompleteSteps[currentStepIndex] || 1;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === incompleteSteps.length - 1;
  const totalIncomplete = incompleteSteps.length;
  
  // Calculate progress: steps completed / total steps
  const progress = Math.round((completedSteps.length / totalSteps) * 100);

  const goToNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
    
    setIncompleteSteps((prev) => prev.filter((s) => s !== step));
  };

  return {
    incompleteSteps,
    completedSteps,
    currentStepIndex,
    currentWizardStep,
    isFirstStep,
    isLastStep,
    totalIncomplete,
    totalSteps,
    progress,
    goToNext,
    goToPrevious,
    markStepComplete,
    isLoading,
    error,
  };
};
