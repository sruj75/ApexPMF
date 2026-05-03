"use server";

import { redirect } from "next/navigation";
import { startPracticeForLearner } from "@/src/application/start-session/start-practice";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import { createOpenRouterChatClient } from "@/src/infrastructure/llm/openrouter";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";

const defaultOpenRouterModel = "openrouter/free";

export async function startPracticeAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const startedSession = await startPracticeForLearner(user.id, {
    idealCustomerProfileRepository:
      createSupabaseIdealCustomerProfileRepository(supabase),
    generatedSessionCaseRepository:
      createSupabaseGeneratedSessionCaseRepository(supabase),
    personaGenerator: createProductionPersonaGenerator()
  });

  redirect(`/practice/${startedSession.sessionId}`);
}

function createProductionPersonaGenerator() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to Start Practice.");
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
