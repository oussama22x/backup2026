-- Add duration_seconds column with default 120
ALTER TABLE public.archetypes 
ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 120;

-- Set Quick Pace (60 seconds) for 5 archetypes
UPDATE public.archetypes 
SET duration_seconds = 60 
WHERE archetype_id IN (
  'A2_clarify_ask',
  'E2_define_done',
  'CC1_translate_for_audience',
  'CC2_report_up',
  'EI4_credit_accountability'
);

-- Set Deep-Dive Pace (180 seconds) for 5 archetypes
UPDATE public.archetypes 
SET duration_seconds = 180 
WHERE archetype_id IN (
  'C4_hypothesize_test',
  'E3_anticipate_risk',
  'A4_self_correction',
  'J1_ethical_tradeoff',
  'CC4_integrate_feedback'
);