import { Context, Effect, Layer } from "effect";
import {
  createOpenRouterHiddenEvaluationJudge,
  type OpenRouterChatClient
} from "@/src/infrastructure/llm/openrouter";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import type { PersonaGenerator } from "@/src/domain/persona/persona-generation";
import {
  createHiddenEvaluationEngine,
  type HiddenEvaluationEngine
} from "@/src/domain/session/hidden-evaluation-engine";
import {
  NonLiveLlmProviderUnavailableError,
  resolveNonLiveLlmAccess
} from "@/src/application/non-live-llm-policy";

export class OpenRouterChatClientService extends Context.Tag(
  "OpenRouterChatClientService"
)<OpenRouterChatClientService, OpenRouterChatClient>() {}

export class PersonaGenerationCapability extends Context.Tag(
  "PersonaGenerationCapability"
)<PersonaGenerationCapability, PersonaGenerator>() {}

export class HiddenEvaluationCapability extends Context.Tag(
  "HiddenEvaluationCapability"
)<HiddenEvaluationCapability, HiddenEvaluationEngine>() {}

export const personaGenerationCapabilityLayer: Layer.Layer<
  PersonaGenerationCapability,
  never,
  OpenRouterChatClientService
> = Layer.effect(
  PersonaGenerationCapability,
  Effect.gen(function* () {
    const chatClient = yield* OpenRouterChatClientService;
    return createOpenRouterPersonaGenerator({ chatClient });
  })
);

export const hiddenEvaluationCapabilityLayer: Layer.Layer<
  HiddenEvaluationCapability,
  never,
  OpenRouterChatClientService
> = Layer.effect(
  HiddenEvaluationCapability,
  Effect.gen(function* () {
    const chatClient = yield* OpenRouterChatClientService;
    return createHiddenEvaluationEngine({
      judge: createOpenRouterHiddenEvaluationJudge({ chatClient })
    });
  })
);

export function openRouterChatClientLayerFromEnv(
  env: NodeJS.ProcessEnv
): Layer.Layer<
  OpenRouterChatClientService,
  NonLiveLlmProviderUnavailableError,
  never
> {
  return Layer.effect(
    OpenRouterChatClientService,
    resolveNonLiveLlmAccess(env).pipe(Effect.map((access) => access.chatClient))
  );
}

export function requiredPersonaGenerationCapabilityLayerFromEnv(
  env: NodeJS.ProcessEnv
): Layer.Layer<
  PersonaGenerationCapability,
  NonLiveLlmProviderUnavailableError,
  never
> {
  return personaGenerationCapabilityLayer.pipe(
    Layer.provide(openRouterChatClientLayerFromEnv(env))
  );
}

const unavailableHiddenEvaluationEngine: HiddenEvaluationEngine = {
  evaluateEndedSession: () =>
    Effect.succeed({
      status: "insufficient-evidence",
      reason: "provider-failure"
    })
};

export function degradableHiddenEvaluationCapabilityLayerFromEnv(
  env: NodeJS.ProcessEnv
): Layer.Layer<HiddenEvaluationCapability, never, never> {
  const liveLayer = hiddenEvaluationCapabilityLayer.pipe(
    Layer.provide(openRouterChatClientLayerFromEnv(env))
  );
  return liveLayer.pipe(
    Layer.catchAll((error) =>
      Layer.effect(
        HiddenEvaluationCapability,
        Effect.logWarning("hidden-evaluation.provider_unavailable", {
          reason: error.category,
          missingEnvVar: error.missingEnvVar
        }).pipe(Effect.map(() => unavailableHiddenEvaluationEngine))
      )
    )
  );
}
