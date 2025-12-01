-- Add behavioral_anchors column to archetypes table
ALTER TABLE public.archetypes ADD COLUMN IF NOT EXISTS behavioral_anchors JSONB;

-- Populate behavioral_anchors for all 24 archetypes with correct IDs

-- Cognitive Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Misidentifies the problem or fixates on symptoms.", "1": "Recognizes the problem but struggles to isolate root cause.", "2": "Accurately identifies the core issue and underlying drivers.", "3": "Diagnoses root cause and anticipates secondary implications.", "micro_focus": "Does the candidate pinpoint the real problem or get distracted by surface-level symptoms?"}'::jsonb WHERE archetype_id = 'C1_diagnose';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Tackles tasks randomly or defaults to easiest first.", "1": "Uses a simple heuristic (e.g., deadlines) but misses impact trade-offs.", "2": "Balances urgency and impact to sequence work logically.", "3": "Proactively deprioritizes low-value tasks and explains trade-offs.", "micro_focus": "Does the candidate distinguish high-leverage actions from busy work?"}'::jsonb WHERE archetype_id = 'C2_prioritize';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Ignores constraints or proposes solutions that clearly won''t work.", "1": "Acknowledges trade-offs but defaults to one dimension (e.g., speed over quality).", "2": "Explicitly weighs competing factors and proposes a balanced approach.", "3": "Articulates multi-dimensional trade-offs and adjusts strategy based on context.", "micro_focus": "Does the candidate navigate competing priorities thoughtfully or oversimplify?"}'::jsonb WHERE archetype_id = 'C3_tradeoff';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Jumps to conclusions without evidence or testing assumptions.", "1": "States a hypothesis but doesn''t articulate how to validate it.", "2": "Proposes a testable hypothesis and outlines a validation approach.", "3": "Designs rigorous tests, anticipates failure modes, and plans iteration.", "micro_focus": "Does the candidate approach uncertainty systematically or rely on guesswork?"}'::jsonb WHERE archetype_id = 'C4_hypothesize_test';

-- Execution Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Jumps into execution without a plan; steps are haphazard.", "1": "Outlines steps but misses dependencies or sequencing logic.", "2": "Creates a logical, step-by-step plan that accounts for dependencies.", "3": "Anticipates bottlenecks, builds in flexibility, and sequences for efficiency.", "micro_focus": "Does the candidate think through the end-to-end workflow or dive in blindly?"}'::jsonb WHERE archetype_id = 'E1_plan_sequence';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Vague or moving target for what success looks like.", "1": "Defines done but leaves ambiguity in edge cases or acceptance criteria.", "2": "Sets clear, measurable success criteria upfront.", "3": "Defines success criteria and proactively aligns stakeholders to prevent scope creep.", "micro_focus": "Does the candidate establish crisp completion criteria or leave it fuzzy?"}'::jsonb WHERE archetype_id = 'E2_define_done';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Doesn''t identify risks or dismisses concerns as unlikely.", "1": "Mentions risks but doesn''t plan mitigations.", "2": "Identifies key risks and outlines mitigation strategies.", "3": "Proactively surfaces risks, prioritizes by impact, and builds in contingency plans.", "micro_focus": "Does the candidate think ahead to what could go wrong and plan accordingly?"}'::jsonb WHERE archetype_id = 'E3_anticipate_risk';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Freezes, gives up, or ignores constraints entirely.", "1": "Acknowledges constraints but struggles to adapt the plan.", "2": "Adjusts approach pragmatically given time, resource, or scope limits.", "3": "Creatively navigates constraints, finds leverage points, and delivers impact despite limits.", "micro_focus": "Does the candidate find a way forward when conditions are less than ideal?"}'::jsonb WHERE archetype_id = 'E4_execute_under_constraint';

-- Communication & Collaboration Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Uses jargon or overly technical language that confuses the audience.", "1": "Adjusts tone but still assumes too much context or expertise.", "2": "Tailors message clearly for the audience''s level and priorities.", "3": "Anticipates audience questions and frames message to drive action or alignment.", "micro_focus": "Does the candidate communicate in a way that resonates with the listener?"}'::jsonb WHERE archetype_id = 'CC1_translate_for_audience';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Rambles, buries the lede, or fails to convey key takeaways.", "1": "Provides some context but doesn''t prioritize what leadership cares about.", "2": "Leads with the headline, provides context, and highlights decisions needed.", "3": "Delivers concise, actionable updates that anticipate exec-level questions and trade-offs.", "micro_focus": "Does the candidate communicate up in a way that respects senior stakeholders'' time and priorities?"}'::jsonb WHERE archetype_id = 'CC2_report_up';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Avoids conflict, becomes defensive, or escalates unnecessarily.", "1": "Engages but struggles to find common ground or de-escalate tension.", "2": "Listens actively, seeks to understand, and works toward compromise.", "3": "Navigates disagreement constructively, builds consensus, and strengthens relationships.", "micro_focus": "Does the candidate handle conflict productively or let it derail progress?"}'::jsonb WHERE archetype_id = 'CC3_resolve_disagreement';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Ignores feedback or becomes defensive when challenged.", "1": "Acknowledges feedback but doesn''t incorporate it meaningfully.", "2": "Actively solicits feedback, considers it, and adjusts approach.", "3": "Seeks diverse input proactively, synthesizes it, and strengthens outcomes as a result.", "micro_focus": "Does the candidate treat feedback as a gift or a threat?"}'::jsonb WHERE archetype_id = 'CC4_integrate_feedback';

-- Adaptability & Learning Agility Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Freezes, panics, or insists on sticking to the original plan despite changes.", "1": "Acknowledges the change but struggles to adjust quickly or effectively.", "2": "Adapts approach pragmatically and pivots without losing momentum.", "3": "Thrives in ambiguity, reframes the problem, and finds opportunity in disruption.", "micro_focus": "Does the candidate stay nimble when plans change or dig in their heels?"}'::jsonb WHERE archetype_id = 'A1_curveball_reaction';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Pretends to understand or nods along without seeking clarity.", "1": "Asks surface-level questions but doesn''t dig into root ambiguity.", "2": "Asks targeted questions to clarify assumptions and unknowns.", "3": "Proactively identifies gaps, asks clarifying questions, and confirms shared understanding.", "micro_focus": "Does the candidate seek clarity when things are unclear or fake it?"}'::jsonb WHERE archetype_id = 'A2_clarify_ask';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Avoids trying new approaches or waits for perfect information before acting.", "1": "Experiments but doesn''t structure tests to extract clear learnings.", "2": "Designs small, low-risk experiments to validate assumptions.", "3": "Systematically tests hypotheses, learns quickly, and iterates based on evidence.", "micro_focus": "Does the candidate treat uncertainty as a learning opportunity or a blocker?"}'::jsonb WHERE archetype_id = 'A3_experiment_design';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Doubles down on mistakes or blames external factors.", "1": "Recognizes errors but struggles to adjust behavior meaningfully.", "2": "Acknowledges mistakes, reflects, and adjusts approach.", "3": "Proactively self-corrects, internalizes lessons, and improves continuously.", "micro_focus": "Does the candidate learn from missteps or repeat them?"}'::jsonb WHERE archetype_id = 'A4_self_correction';

-- Emotional Intelligence Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Escalates tension, avoids the situation, or dismisses emotions.", "1": "Tries to calm things down but lacks tact or reads the room poorly.", "2": "Responds with empathy, de-escalates effectively, and rebuilds rapport.", "3": "Anticipates emotional dynamics, proactively diffuses tension, and strengthens trust.", "micro_focus": "Does the candidate handle emotionally charged moments with composure and care?"}'::jsonb WHERE archetype_id = 'EI1_deescalate';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Agrees silently or pushes back aggressively without tact.", "1": "Voices disagreement but comes across as combative or unclear.", "2": "Challenges respectfully, explains reasoning, and invites dialogue.", "3": "Delivers difficult messages with empathy, clarity, and professionalism.", "micro_focus": "Does the candidate speak truth to power constructively or avoid/bulldoze?"}'::jsonb WHERE archetype_id = 'EI2_respectful_pushback';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Becomes defensive, dismisses criticism, or takes it personally.", "1": "Listens but visibly struggles with composure or internalizing the message.", "2": "Receives feedback gracefully, asks clarifying questions, and commits to improvement.", "3": "Actively seeks critical feedback, reflects thoughtfully, and demonstrates growth.", "micro_focus": "Does the candidate treat tough feedback as a learning moment or a personal attack?"}'::jsonb WHERE archetype_id = 'EI3_handle_feedback';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Takes undue credit or deflects blame when things go wrong.", "1": "Shares credit/blame unevenly or inconsistently.", "2": "Consistently attributes success to the team and owns mistakes personally.", "3": "Proactively elevates others'' contributions and models accountability publicly.", "micro_focus": "Does the candidate demonstrate humility and integrity in success and failure?"}'::jsonb WHERE archetype_id = 'EI4_credit_accountability';

-- Judgment & Ethics Dimension
UPDATE public.archetypes SET behavioral_anchors = '{"0": "Ignores ethical concerns or prioritizes expedience over integrity.", "1": "Acknowledges the dilemma but struggles to articulate a principled stance.", "2": "Weighs ethical considerations carefully and makes a defensible choice.", "3": "Proactively raises ethical concerns, considers broader impact, and advocates for the right course.", "micro_focus": "Does the candidate demonstrate moral courage and sound judgment under pressure?"}'::jsonb WHERE archetype_id = 'J1_ethical_tradeoff';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Hides or downplays risks to avoid difficult conversations.", "1": "Discloses risks but in a way that obscures severity or likelihood.", "2": "Transparently communicates risks and provides context for decision-making.", "3": "Proactively surfaces risks early, quantifies impact, and recommends mitigation.", "micro_focus": "Does the candidate communicate risk honestly and responsibly?"}'::jsonb WHERE archetype_id = 'J2_risk_disclosure';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Ignores privacy concerns or treats data carelessly.", "1": "Acknowledges privacy but doesn''t fully grasp compliance or ethical obligations.", "2": "Handles sensitive data responsibly and considers privacy implications.", "3": "Champions data privacy, anticipates compliance needs, and advocates for user protection.", "micro_focus": "Does the candidate treat data privacy as a priority or an afterthought?"}'::jsonb WHERE archetype_id = 'J3_data_privacy_call';

UPDATE public.archetypes SET behavioral_anchors = '{"0": "Proceeds despite clear conflicts of interest without disclosure.", "1": "Recognizes the conflict but doesn''t take steps to mitigate or disclose.", "2": "Discloses conflicts proactively and recuses self when appropriate.", "3": "Anticipates potential conflicts, discloses transparently, and prioritizes organizational integrity.", "micro_focus": "Does the candidate recognize and navigate conflicts of interest ethically?"}'::jsonb WHERE archetype_id = 'J4_conflict_of_interest';

-- Validate and add constraints
DO $$
DECLARE
  total_count INTEGER;
  populated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.archetypes;
  SELECT COUNT(*) INTO populated_count FROM public.archetypes WHERE behavioral_anchors IS NOT NULL;
  
  RAISE NOTICE 'Archetype population: % out of % have behavioral_anchors', populated_count, total_count;
  
  IF populated_count = total_count AND total_count = 24 THEN
    -- All archetypes populated, make it NOT NULL and add CHECK constraint
    ALTER TABLE public.archetypes ALTER COLUMN behavioral_anchors SET NOT NULL;
    
    -- Add CHECK constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'behavioral_anchors_has_all_scores' 
      AND conrelid = 'public.archetypes'::regclass
    ) THEN
      ALTER TABLE public.archetypes ADD CONSTRAINT behavioral_anchors_has_all_scores 
      CHECK (
        behavioral_anchors ? '0' AND 
        behavioral_anchors ? '1' AND 
        behavioral_anchors ? '2' AND 
        behavioral_anchors ? '3' AND 
        behavioral_anchors ? 'micro_focus'
      );
      RAISE NOTICE 'Added NOT NULL constraint and CHECK constraint on behavioral_anchors';
    END IF;
  ELSE
    RAISE NOTICE 'WARNING: Only % out of % archetypes were populated. Leaving behavioral_anchors nullable.', populated_count, total_count;
  END IF;
END $$;

-- Drop the old quality_evals_prompt column
ALTER TABLE public.archetypes DROP COLUMN IF EXISTS quality_evals_prompt;