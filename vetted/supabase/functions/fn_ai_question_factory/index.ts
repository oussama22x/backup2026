import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// ===== TYPE DEFINITIONS =====

type DimensionWeights = {
  cognitive: number;
  execution: number;
  communication_collaboration: number;
  adaptability_learning: number;
  emotional_intelligence: number;
  judgment_ethics: number;
};

type RoleDefinitionResult = {
  definition_data: {
    goals: string;
    stakeholders: string;
    decision_horizon: string;
    tools: string;
    kpis: string;
    constraints: string;
    cognitive_type: string;
    team_topology: string;
    cultural_tone: string;
  };
  context_flags: {
    role_family: string;
    seniority: string;
    is_startup_context: boolean;
    is_people_management: boolean;
  };
  clarifier_inputs: {
    ambiguity: boolean;
    time_pressure: boolean;
    cross_functional: boolean;
    customer_facing: boolean;
    regulated: boolean;
    analytical_data_heavy: boolean;
  };
  weighted_dimensions: {
    weights: DimensionWeights;
    rationale: string;
    bank_id: string;
  };
};

type Archetype = {
  archetype_id: string;
  dimension: string;
  logic_prompt: string;
  parameters_needed: string[];
  behavioral_anchors: {
    micro_focus: string;
    "0": string;
    "1": string;
    "2": string;
    "3": string;
  };
  duration_seconds: number;
};

type QuestionObject = {
  question_id: string;
  dimension: string;
  archetype_id: string;
  question_text: string;
  duration_seconds: number;
  context_used: Record<string, string>;
  quality_score: number;
  generated_at: string;
};

type SoftFailReason = "RATE_LIMIT" | "SERVICE_UNAVAILABLE";

// ===== CONSTANTS =====

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const TARGET_QUESTION_COUNT = 15;
const MAX_RETRIES_PER_QUESTION = 5;
const MAX_TOTAL_RETRIES = 60;
const RATE_LIMIT_COOLDOWN_TRIGGER = 3;
const RATE_LIMIT_COOLDOWN_BASE_MS = 20000; // 20s base cooldown when rate limits persist
const RATE_LIMIT_COOLDOWN_MAX_MS = 60000; // cap cooldown at 60s to avoid excessively long waits
const RATE_LIMIT_COOLDOWN_JITTER_MS = 5000; // ± up to 5s jitter for cooldown spacing

// Strategic pacing to prevent workspace rate limits
const STRATEGIC_PACE_MS = 2500; // 2.5 seconds between questions
const JITTER_MS = 500; // ±500ms randomization

const GENERATION_SYSTEM_PROMPT = `You are an expert assessment designer creating work simulation questions for talent evaluation.

Your task:
- Generate ONE realistic, role-specific question based on the provided scenario
- The question should test real-world problem-solving in the given context
- Keep questions concise (2-4 sentences max)
- Make questions actionable (e.g., "What would you do?", "How would you approach?")
- Avoid academic/trivia questions - focus on practical judgment

Context: {{role_context}}
Scenario: {{parameterized_prompt}}

Generate a clear, realistic question that a candidate would encounter in this role.`;

// Parameter mapping for prompt parameterization
const PARAMETER_MAP: Record<string, (rd: RoleDefinitionResult) => string> = {
  'metric A': (rd) => rd.definition_data.kpis.split(',')[0]?.trim() || 'key performance metric',
  'dataset type': (rd) => rd.definition_data.tools || 'relevant data source',
  'competing inputs': (rd) => `${rd.definition_data.stakeholders} and ${rd.definition_data.constraints}`,
  'paired options': (rd) => `Option A (${rd.definition_data.decision_horizon}) vs Option B (alternative approach)`,
  'observation context': (rd) => rd.definition_data.goals,
  'deliverable goal': (rd) => rd.definition_data.goals,
  'project name': (rd) => rd.context_flags.role_family + ' initiative',
  'initiative context': (rd) => rd.definition_data.goals,
  'resource limit': (rd) => rd.definition_data.constraints,
  'concept': (rd) => rd.definition_data.cognitive_type + ' work',
  'audience': (rd) => rd.definition_data.stakeholders,
  'stakeholder': (rd) => rd.definition_data.stakeholders.split(',')[0]?.trim() || 'key stakeholder',
  'status': (rd) => 'current project status',
  'teams': (rd) => rd.definition_data.team_topology,
  'issue': (rd) => 'strategic decision point',
  'deliverable': (rd) => rd.definition_data.goals,
  'project': (rd) => rd.context_flags.role_family + ' project',
  'new info': (rd) => 'unexpected constraint or opportunity',
  'goal context': (rd) => rd.definition_data.goals,
  'assumption': (rd) => rd.definition_data.kpis,
  'outcome context': (rd) => 'recent initiative outcome',
  'angry stakeholder': (rd) => rd.definition_data.stakeholders.split(',')[0]?.trim() || 'stakeholder',
  'problem': (rd) => rd.definition_data.constraints,
  'power dynamic': (rd) => rd.context_flags.is_people_management ? 'senior peer' : 'manager',
  'decision': (rd) => 'strategic direction',
  'work': (rd) => 'deliverable',
  'event': (rd) => 'team milestone',
  'action': (rd) => 'proposed initiative',
  'risk type': (rd) => rd.clarifier_inputs.regulated ? 'compliance risk' : 'operational risk',
  'data type': (rd) => rd.definition_data.tools || 'user data'
};

// ===== HELPER FUNCTIONS =====

/**
 * Calculate question distribution across 6 dimensions
 * Ensures sum equals exactly 40
 */
function calculateQuestionDistribution(weights: DimensionWeights): Record<string, number> {
  // Step 1: Calculate raw counts
  const rawCounts = {
    cognitive: weights.cognitive * TARGET_QUESTION_COUNT,
    execution: weights.execution * TARGET_QUESTION_COUNT,
    communication_collaboration: weights.communication_collaboration * TARGET_QUESTION_COUNT,
    adaptability_learning: weights.adaptability_learning * TARGET_QUESTION_COUNT,
    emotional_intelligence: weights.emotional_intelligence * TARGET_QUESTION_COUNT,
    judgment_ethics: weights.judgment_ethics * TARGET_QUESTION_COUNT
  };

  // Step 2: Floor all values
  const floored: Record<string, number> = {};
  for (const [dim, val] of Object.entries(rawCounts)) {
    floored[dim] = Math.floor(val);
  }

  // Step 3: Calculate remainder to distribute
  const currentSum = Object.values(floored).reduce((a, b) => a + b, 0);
  const remainder = TARGET_QUESTION_COUNT - currentSum;

  // Step 4: Distribute remainder to dimensions with highest fractional parts
  if (remainder > 0) {
    const fractionalParts = Object.entries(rawCounts)
      .map(([dim, val]) => ({ dim, frac: val - Math.floor(val) }))
      .sort((a, b) => b.frac - a.frac)
      .slice(0, remainder);

    fractionalParts.forEach(({ dim }) => {
      floored[dim] += 1;
    });
  }

  return floored;
}

/**
 * Group archetypes by dimension for easy lookup
 */
function groupArchetypesByDimension(archetypes: Archetype[]): Record<string, Archetype[]> {
  const dimensionMap: Record<string, string> = {
    'Cognitive': 'cognitive',
    'Execution': 'execution',
    'Communication & Collaboration': 'communication_collaboration',
    'Adaptability & Learning Agility': 'adaptability_learning',
    'Emotional Intelligence': 'emotional_intelligence',
    'Judgment & Ethics': 'judgment_ethics'
  };

  const grouped: Record<string, Archetype[]> = {
    cognitive: [],
    execution: [],
    communication_collaboration: [],
    adaptability_learning: [],
    emotional_intelligence: [],
    judgment_ethics: []
  };

  archetypes.forEach(archetype => {
    const normalizedDim = dimensionMap[archetype.dimension];
    if (normalizedDim && grouped[normalizedDim]) {
      grouped[normalizedDim].push(archetype);
    }
  });

  return grouped;
}

/**
 * Select a random archetype from the available pool
 * Uses balanced selection to distribute usage evenly
 */
function selectRandomArchetype(archetypes: Archetype[], usageCounter: Map<string, number>): Archetype {
  // Sort by usage count (least used first)
  const sorted = [...archetypes].sort((a, b) => {
    const usageA = usageCounter.get(a.archetype_id) || 0;
    const usageB = usageCounter.get(b.archetype_id) || 0;
    return usageA - usageB;
  });

  // Pick the least used one
  const selected = sorted[0];
  usageCounter.set(
    selected.archetype_id,
    (usageCounter.get(selected.archetype_id) || 0) + 1
  );

  return selected;
}

/**
 * Parameterize the logic prompt by replacing placeholders with role context
 */
function parameterizePrompt(
  logicPrompt: string,
  parametersNeeded: string[],
  roleDefinition: RoleDefinitionResult
): string {
  let parameterized = logicPrompt;

  parametersNeeded.forEach(param => {
    const resolver = PARAMETER_MAP[param];
    if (resolver) {
      const value = resolver(roleDefinition);
      // Replace [param] with value (case-insensitive)
      const regex = new RegExp(`\\[${param}\\]`, 'gi');
      parameterized = parameterized.replace(regex, value);
    }
  });

  return parameterized;
}

/**
 * Extract context used for parameterization
 */
function extractUsedContext(
  parametersNeeded: string[],
  roleDefinition: RoleDefinitionResult
): Record<string, string> {
  const context: Record<string, string> = {};

  parametersNeeded.forEach(param => {
    const resolver = PARAMETER_MAP[param];
    if (resolver) {
      context[param] = resolver(roleDefinition);
    }
  });

  return context;
}

/**
 * Call Lovable AI to generate a question
 */
async function callAIForGeneration(
  parameterizedPrompt: string,
  roleDefinition: RoleDefinitionResult
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const roleContext = `
    Role: ${roleDefinition.context_flags.role_family} (${roleDefinition.context_flags.seniority})
    Primary Goals: ${roleDefinition.definition_data.goals}
    Key Stakeholders: ${roleDefinition.definition_data.stakeholders}
    Decision Horizon: ${roleDefinition.definition_data.decision_horizon}
  `.trim();

  const systemPrompt = GENERATION_SYSTEM_PROMPT
    .replace('{{role_context}}', roleContext)
    .replace('{{parameterized_prompt}}', parameterizedPrompt);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the question now." }
      ],
      temperature: 0.8
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
    }
    
    // Capture response body for diagnostics
    let errorBody = "";
    try {
      const errorData = await response.json();
      errorBody = JSON.stringify(errorData);
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = "(no body)";
      }
    }
    
    console.error(`❌ [GENERATION] AI Gateway ${response.status} Error:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody.substring(0, 500), // First 500 chars
      timestamp: new Date().toISOString()
    });
    
    // Classify error types
    if (response.status === 503) {
      throw new Error("SERVICE_UNAVAILABLE");
    }
    if (response.status >= 500 && response.status < 600) {
      throw new Error(`SERVER_ERROR_${response.status}`);
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content?.trim();

  if (!generatedText) {
    throw new Error("AI returned empty response");
  }

  return generatedText;
}

/**
 * Generate a single question with retry logic
 */
async function generateQuestionWithRetry(
  archetype: Archetype,
  roleDefinition: RoleDefinitionResult,
  questionNumber: number,
  retries: number = 0
): Promise<QuestionObject | null> {
  try {
    const parameterizedPrompt = parameterizePrompt(
      archetype.logic_prompt,
      archetype.parameters_needed || [],
      roleDefinition
    );

    const generatedText = await callAIForGeneration(parameterizedPrompt, roleDefinition);
    
    // Return question immediately with default quality score (no evaluation)
    return {
      question_id: `Q${String(questionNumber).padStart(3, '0')}_${archetype.archetype_id}`,
      dimension: archetype.dimension,
      archetype_id: archetype.archetype_id,
      question_text: generatedText,
      duration_seconds: archetype.duration_seconds,
      context_used: extractUsedContext(archetype.parameters_needed || [], roleDefinition),
      quality_score: 3, // Default: trust archetype design
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === 'RATE_LIMIT') {
      if (retries < MAX_RETRIES_PER_QUESTION) {
        const backoffMs = 2000 * Math.pow(2, retries);
        console.log(`[RATE_LIMIT_HIT] Time: ${new Date().toISOString()}, Q: ${questionNumber}, Dim: ${archetype.dimension}, Retries: ${retries}`);
        console.log(`⏳ Rate limited. Backing off ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return generateQuestionWithRetry(archetype, roleDefinition, questionNumber, retries + 1);
      }

      console.warn(`⚠️ [SOFT_FAIL] Skipping Q${questionNumber} (${archetype.archetype_id}) after exhausting retries for RATE_LIMIT`);
      throw new Error('SOFT_FAIL_RATE_LIMIT');
    }

    if (errorMessage === 'SERVICE_UNAVAILABLE') {
      if (retries < MAX_RETRIES_PER_QUESTION) {
        // 503: Retry with longer backoff (service is overloaded)
        const backoffMs = 3000 * Math.pow(2, retries);
        console.log(`[SERVICE_UNAVAILABLE] Q: ${questionNumber}, Retries: ${retries}, Backing off ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return generateQuestionWithRetry(archetype, roleDefinition, questionNumber, retries + 1);
      }

      console.warn(`⚠️ [SOFT_FAIL] Skipping Q${questionNumber} (${archetype.archetype_id}) after exhausting retries for SERVICE_UNAVAILABLE`);
      throw new Error('SOFT_FAIL_SERVICE_UNAVAILABLE');
    }

    // For other 5xx errors, try once more with short delay
    if (errorMessage.startsWith('SERVER_ERROR_') && retries === 0) {
      console.log(`[SERVER_ERROR] Q: ${questionNumber}, Retrying once after 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateQuestionWithRetry(archetype, roleDefinition, questionNumber, retries + 1);
    }

    // Hard fail for actual errors
    throw error;
  }
}

/**
 * Generate all 30 questions across dimensions
 */
async function generateAllQuestions(
  distribution: Record<string, number>,
  groupedArchetypes: Record<string, Archetype[]>,
  roleDefinition: RoleDefinitionResult
): Promise<QuestionObject[]> {
  const allQuestions: QuestionObject[] = [];
  let questionCounter = 1;
  let totalRetries = 0;
  let skippedCount = 0;
  let cooldownStreak = 0;
  let consecutiveServerErrors = 0;
  let lastSoftFailReason: SoftFailReason | null = null;
  const CIRCUIT_BREAKER_THRESHOLD = 3;
  const usageCounter = new Map<string, number>();

  for (const [dimension, count] of Object.entries(distribution)) {
    console.log(`🔄 Generating ${count} questions for ${dimension}...`);

    const availableArchetypes = groupedArchetypes[dimension];
    if (!availableArchetypes || availableArchetypes.length === 0) {
      console.error(`❌ No archetypes found for dimension: ${dimension}`);
      throw new Error(`No archetypes available for ${dimension}`);
    }

    for (let i = 0; i < count; i++) {
      if (totalRetries > MAX_TOTAL_RETRIES) {
        throw new Error(`Exceeded maximum total retries (${MAX_TOTAL_RETRIES})`);
      }

      const archetype = selectRandomArchetype(availableArchetypes, usageCounter);

      let question: QuestionObject | null = null;
      let softFailReason: SoftFailReason | null = null;

      try {
        question = await generateQuestionWithRetry(
          archetype,
          roleDefinition,
          questionCounter
        );

        // Reset circuit breaker on successful call
        consecutiveServerErrors = 0;
        lastSoftFailReason = null;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage === 'SOFT_FAIL_RATE_LIMIT' || errorMessage === 'SOFT_FAIL_SERVICE_UNAVAILABLE') {
          softFailReason = errorMessage === 'SOFT_FAIL_RATE_LIMIT' ? 'RATE_LIMIT' : 'SERVICE_UNAVAILABLE';
          lastSoftFailReason = softFailReason;
          consecutiveServerErrors = 0;
          question = null;
        } else {
          // Track consecutive 5xx errors for circuit breaker
          if (errorMessage.startsWith('SERVER_ERROR_') || errorMessage === 'SERVICE_UNAVAILABLE') {
            consecutiveServerErrors++;

            if (consecutiveServerErrors >= CIRCUIT_BREAKER_THRESHOLD) {
              throw new Error(
                `UPSTREAM_DEGRADED: Lovable AI Gateway returned ${consecutiveServerErrors} consecutive 5xx errors. ` +
                `This indicates a service issue. Please check your credits at Settings > Workspace > Usage, ` +
                `or try again in a few minutes if the service is degraded.`
              );
            }
          } else {
            consecutiveServerErrors = 0;
          }

          cooldownStreak = 0;
          throw error; // Re-throw for main handler
        }
      }

      if (question) {
        allQuestions.push(question);
        questionCounter++;
        console.log(`✅ Q${questionCounter - 1}: ${dimension} (${archetype.archetype_id}) - Generated successfully`);
        
        // Reset skip counter on success
        skippedCount = 0;
        cooldownStreak = 0;
        
        // Strategic pacing to prevent workspace rate limits
        if (questionCounter <= TARGET_QUESTION_COUNT) {
          const delay = STRATEGIC_PACE_MS + (Math.random() * JITTER_MS * 2 - JITTER_MS);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        // Failed to generate after retries (soft fail)
        skippedCount++;

        if (!softFailReason && lastSoftFailReason) {
          softFailReason = lastSoftFailReason;
        }

        if (softFailReason) {
          if (softFailReason !== 'RATE_LIMIT') {
            cooldownStreak = 0;
          }
          const reasonText = softFailReason === 'RATE_LIMIT'
            ? 'Lovable AI rate limit'
            : 'Lovable AI gateway availability';
          console.warn(
            `⚠️ [SOFT_FAIL] ${reasonText} while generating ${dimension}. ` +
            `(skipped ${skippedCount}, cooldown streak ${cooldownStreak})`
          );
        }

        const shouldCooldown = softFailReason && skippedCount >= RATE_LIMIT_COOLDOWN_TRIGGER;
        const skipCountForLog = skippedCount;

        if (!shouldCooldown && skippedCount >= 5) {
          throw new Error(
            `SERVICE_OVERLOADED: Lovable returned ${skippedCount} consecutive rate limits. ` +
            `Wait ~60 seconds before retrying so the gateway cooldown can reset.`
          );
        }

        if (shouldCooldown && softFailReason) {
          cooldownStreak += 1;
          const multiplier = Math.min(cooldownStreak, 3);
          const cooldownMs = Math.min(
            RATE_LIMIT_COOLDOWN_BASE_MS * multiplier,
            RATE_LIMIT_COOLDOWN_MAX_MS
          );
          const jitter = Math.floor(Math.random() * RATE_LIMIT_COOLDOWN_JITTER_MS);
          const totalCooldown = cooldownMs + jitter;
          console.warn(
            `🧊 [COOLDOWN] ${softFailReason === 'RATE_LIMIT' ? 'Rate limits' : 'Gateway 503s'} persisted for ${skipCountForLog} attempts ` +
            `(cooldown streak ${cooldownStreak}). Cooling down for ${totalCooldown}ms before retrying...`
          );
          await new Promise(resolve => setTimeout(resolve, totalCooldown));
          skippedCount = 0;
          consecutiveServerErrors = 0;
        }

        i--;
        totalRetries++;
        const logSkipCount = shouldCooldown ? skipCountForLog : skippedCount;
        console.log(
          `🔄 Retrying generation for ${dimension} ` +
          `(skipped: ${logSkipCount}, cooldown streak: ${cooldownStreak}, total retries: ${totalRetries})...`
        );
      }
    }
  }

  return allQuestions;
}

/**
 * Save questions to database
 */
async function saveQuestionsToDatabase(
  supabase: any,
  bankId: string,
  questions: QuestionObject[]
): Promise<void> {
  console.log(`💾 Saving ${questions.length} questions to role_master_banks...`);

  const { error } = await supabase
    .from('role_master_banks')
    .update({
      questions: questions,
      status: 'READY',
      failure_reason: null,
      updated_at: new Date().toISOString()
    })
    .eq('bank_id', bankId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }

  console.log(`✅ Successfully saved questions for bank_id: ${bankId}`);
}

/**
 * Mark bank as failed in database
 */
async function markBankAsFailed(
  supabase: any,
  bankId: string,
  errorMessage: string
): Promise<void> {
  console.error(`❌ Marking bank_id ${bankId} as FAILED due to: ${errorMessage}`);

  const sanitizedMessage = (errorMessage || 'Unknown error').slice(0, 500);

  await supabase
    .from('role_master_banks')
    .update({
      status: 'FAILED',
      failure_reason: sanitizedMessage,
      updated_at: new Date().toISOString()
    })
    .eq('bank_id', bankId);
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  let bankId: string | null = null;
  let supabase: any = null;

  try {
    console.log("🚀 fn_ai_question_factory invoked");

    // Parse request body
    const body = await req.json();
    const { roleDefinition, bank_id } = body;

    if (!roleDefinition || !bank_id) {
      return new Response(JSON.stringify({ error: "Missing roleDefinition or bank_id" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    bankId = bank_id;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate question distribution
    const distribution = calculateQuestionDistribution(roleDefinition.weighted_dimensions.weights);
    console.log("📊 Question distribution:", distribution);

    // Verify distribution sums to 40
    const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (sum !== TARGET_QUESTION_COUNT) {
      throw new Error(`Distribution sum mismatch: expected ${TARGET_QUESTION_COUNT}, got ${sum}`);
    }

    // Fetch archetypes
    const { data: archetypes, error: archetypeError } = await supabase
      .from('archetypes')
      .select('*');

    if (archetypeError || !archetypes || archetypes.length === 0) {
      throw new Error(`Failed to fetch archetypes: ${archetypeError?.message || 'No archetypes found'}`);
    }

    const groupedArchetypes = groupArchetypesByDimension(archetypes);
    console.log("📚 Loaded archetypes by dimension:", Object.keys(groupedArchetypes));

    // Generate questions
    const questions = await generateAllQuestions(
      distribution,
      groupedArchetypes,
      roleDefinition
    );

    if (questions.length !== TARGET_QUESTION_COUNT) {
      throw new Error(`Expected ${TARGET_QUESTION_COUNT} questions, generated ${questions.length}`);
    }

    // Save to database
    if (!bankId) {
      throw new Error("bank_id is required");
    }
    await saveQuestionsToDatabase(supabase, bankId, questions);

    return new Response(JSON.stringify({
      success: true,
      bank_id: bankId,
      question_count: questions.length,
      message: "Role Master Bank generated successfully"
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error in fn_ai_question_factory:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    // Mark bank as failed if we have context
    if (bankId && supabase) {
      try {
        await markBankAsFailed(supabase, bankId, errorMessage);
      } catch (markError) {
        console.error("Failed to mark bank as FAILED:", markError);
      }
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      bank_id: bankId
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
});
