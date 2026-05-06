import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classifyEntryFailure,
  createEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import { startPracticeForLearner } from "@/src/application/start-session/start-practice";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import { createOpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";

const defaultOpenRouterModel = "openrouter/free";

export type LearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      supabase: SupabaseClient;
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated"
    };
  }

  return {
    ok: true,
    learnerId: user.id,
    supabase
  };
}

export async function startPracticeFromEntryContext(context: {
  learnerId: string;
  supabase: SupabaseClient;
}): Promise<StartPracticeSeamResult> {
  try {
    const startedSession = await startPracticeForLearner(context.learnerId, {
      idealCustomerProfileRepository:
        createProfileSettingsRepository(context.supabase),
      generatedSessionCaseRepository:
        createPracticeSessionCaseRepository(context.supabase),
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

export function createProfileSettingsRepository(
  supabase: SupabaseClient
): IdealCustomerProfileRepository {
  return createSupabaseIdealCustomerProfileRepository(supabase);
}

export function createPracticeSessionCaseRepository(
  supabase: SupabaseClient
): GeneratedSessionCaseRepository {
  return createSupabaseGeneratedSessionCaseRepository(supabase);
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
