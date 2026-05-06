import {
  classifyEntryFailure,
  createEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import { startPracticeForLearner } from "@/src/application/start-session/start-practice";
import { createOpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import {
  getSupabaseLearnerEntryContext,
  type SupabaseLearnerEntryContextResult
} from "@/src/infrastructure/supabase/learner-entry-context";

const defaultOpenRouterModel = "openrouter/free";

export type LearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      idealCustomerProfileRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["idealCustomerProfileRepository"];
      generatedSessionCaseRepository: Extract<
        SupabaseLearnerEntryContextResult,
        { ok: true }
      >["generatedSessionCaseRepository"];
    }
  | {
      ok: false;
      reason: "unauthenticated";
    };

export type StartPracticeSeamResult =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      failure: EntryFailure;
    };

export async function getLearnerEntryContext(): Promise<LearnerEntryContextResult> {
  return getSupabaseLearnerEntryContext();
}

export async function startPracticeFromEntryContext(context: {
  learnerId: string;
  idealCustomerProfileRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["idealCustomerProfileRepository"];
  generatedSessionCaseRepository: Extract<
    LearnerEntryContextResult,
    { ok: true }
  >["generatedSessionCaseRepository"];
}): Promise<StartPracticeSeamResult> {
  try {
    const startedSession = await startPracticeForLearner(context.learnerId, {
      idealCustomerProfileRepository: context.idealCustomerProfileRepository,
      generatedSessionCaseRepository: context.generatedSessionCaseRepository,
      personaGenerator: createProductionPersonaGenerator()
    });

    return {
      ok: true,
      sessionId: startedSession.sessionId
    };
  } catch (cause) {
    return {
      ok: false,
      failure: classifyEntryFailure(cause)
    };
  }
}

function createProductionPersonaGenerator() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw createEntryFailure({
      category: "provider_failure",
      message: "OPENROUTER_API_KEY is required to Start Practice."
    });
  }

  return createOpenRouterPersonaGenerator({
    chatClient: createOpenRouterChatClient({
      apiKey,
      model: process.env.OPENROUTER_MODEL ?? defaultOpenRouterModel,
      siteUrl: process.env.OPENROUTER_SITE_URL,
      appTitle:
        process.env.OPENROUTER_APP_TITLE ?? "The Mom Test Simulator"
    })
  });
}
