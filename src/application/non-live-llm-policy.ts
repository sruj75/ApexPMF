import {
  classifyEntryFailure,
  createEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import {
  StartPracticePersonaGenerationError,
  StartPracticeSessionSourceError
} from "@/src/application/start-session/start-practice";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import {
  PersonaGenerationProviderError,
  type PersonaGenerator
} from "@/src/domain/persona/persona-generation";
import {
  createHiddenEvaluationEngine,
  type HiddenEvaluationEngine
} from "@/src/domain/session/hidden-evaluation-engine";
import type { HiddenEvaluationJudge } from "@/src/domain/session/hidden-evaluation-judge";
import type { SessionEvaluationInsufficientReason } from "@/src/domain/session/session-evaluation";
import {
  createOpenRouterChatClient,
  createOpenRouterHiddenEvaluationJudge,
  OpenRouterProviderError,
  type OpenRouterChatClient
} from "@/src/infrastructure/llm/openrouter";
import { Data, Either, Effect } from "effect";

const defaultOpenRouterModel = "openrouter/free";
const defaultOpenRouterAppTitle = "The Mom Test Simulator";

export class NonLiveLlmProviderUnavailableError extends Data.TaggedError(
  "NonLiveLlmProviderUnavailableError"
)<{
  category: "provider_unavailable";
  missingEnvVar: "OPENROUTER_API_KEY";
  message: string;
}> {}

export class NonLiveLlmProviderFailureError extends Data.TaggedError(
  "NonLiveLlmProviderFailureError"
)<{
  category: "provider_failure";
  message: string;
  phase: OpenRouterProviderError["phase"];
  status?: number;
  statusText?: string;
  cause: OpenRouterProviderError;
}> {}

export type NonLiveLlmFailure =
  | NonLiveLlmProviderUnavailableError
  | NonLiveLlmProviderFailureError;

export type NonLiveLlmAccess = {
  provider: "openrouter";
  configuration: {
    model: string;
    siteUrl?: string;
    appTitle: string;
  };
  chatClient: OpenRouterChatClient;
};

export type NonLiveLlmRuntimePolicy = {
  composePersonaGenerator(): Effect.Effect<
    PersonaGenerator,
    NonLiveLlmProviderUnavailableError,
    never
  >;
  composeHiddenEvaluationEngine(): HiddenEvaluationEngine;
  mapStartSessionFailure(cause: unknown): EntryFailure;
};

export function createNonLiveLlmRuntimePolicy(input?: {
  env?: NodeJS.ProcessEnv;
  createPersonaGenerator?: (input: {
    chatClient: OpenRouterChatClient;
  }) => PersonaGenerator;
  createHiddenEvaluationEngine?: (input: {
    judge: HiddenEvaluationJudge;
  }) => HiddenEvaluationEngine;
}): NonLiveLlmRuntimePolicy {
  const nonLiveLlmAccess = resolveNonLiveLlmAccess(input?.env);
  const personaGeneratorFactory =
    input?.createPersonaGenerator ?? createOpenRouterPersonaGenerator;
  const hiddenEvaluationEngineFactory =
    input?.createHiddenEvaluationEngine ?? createHiddenEvaluationEngine;

  return {
    composePersonaGenerator() {
      return nonLiveLlmAccess.pipe(
        Effect.map((access) =>
          personaGeneratorFactory({
            chatClient: access.chatClient
          })
        )
      );
    },
    composeHiddenEvaluationEngine() {
      const accessResult = Effect.runSync(Effect.either(nonLiveLlmAccess));
      if (Either.isLeft(accessResult)) {
        return createUnavailableHiddenEvaluationEngine(accessResult.left);
      }

      return hiddenEvaluationEngineFactory({
        judge: createOpenRouterHiddenEvaluationJudge({
          chatClient: accessResult.right.chatClient
        })
      });
    },
    mapStartSessionFailure(cause) {
      const normalizedCause = unwrapStartSessionCause(cause);
      const nonLiveLlmFailure = classifyNonLiveLlmFailure(normalizedCause);
      return nonLiveLlmFailure
        ? mapNonLiveLlmFailureToEntryFailure(nonLiveLlmFailure)
        : classifyEntryFailure(normalizedCause);
    }
  };
}

export function resolveNonLiveLlmAccess(
  env: NodeJS.ProcessEnv = process.env
): Effect.Effect<NonLiveLlmAccess, NonLiveLlmProviderUnavailableError, never> {
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return Effect.fail(missingOpenRouterApiKeyFailure());
  }

  const model = env.OPENROUTER_MODEL ?? defaultOpenRouterModel;
  const siteUrl = env.OPENROUTER_SITE_URL;
  const appTitle = env.OPENROUTER_APP_TITLE ?? defaultOpenRouterAppTitle;

  return Effect.succeed({
    provider: "openrouter",
    configuration: {
      model,
      siteUrl,
      appTitle
    },
    chatClient: createOpenRouterChatClient({
      apiKey,
      model,
      siteUrl,
      appTitle
    })
  });
}

export function classifyNonLiveLlmFailure(
  cause: unknown
): NonLiveLlmProviderFailureError | null {
  if (cause instanceof NonLiveLlmProviderFailureError) {
    return cause;
  }

  const openRouterCause = toOpenRouterProviderError(cause);
  if (!openRouterCause) {
    return null;
  }

  return new NonLiveLlmProviderFailureError({
    category: "provider_failure",
    message: openRouterCause.message,
    phase: openRouterCause.phase,
    status: openRouterCause.status,
    statusText: openRouterCause.statusText,
    cause: openRouterCause
  });
}

export function mapNonLiveLlmFailureToEntryFailure(
  failure: NonLiveLlmFailure
): EntryFailure {
  if (failure.category === "provider_unavailable") {
    return createEntryFailure({
      category: "provider_failure",
      message: failure.message
    });
  }

  return createEntryFailure({
    category: "provider_failure",
    message: failure.message,
    cause: failure.cause,
    details: [
      `phase=${failure.phase}`,
      failure.status ? `status=${failure.status}` : "",
      failure.statusText ? `statusText=${failure.statusText}` : ""
    ].filter((detail) => detail.length > 0)
  });
}

export function mapNonLiveLlmFailureToHiddenEvaluationReason(
  failure: NonLiveLlmFailure
): Extract<SessionEvaluationInsufficientReason, "provider-failure"> {
  switch (failure.category) {
    case "provider_unavailable":
    case "provider_failure":
      return "provider-failure";
  }
}

function missingOpenRouterApiKeyFailure(): Extract<
  NonLiveLlmFailure,
  NonLiveLlmProviderUnavailableError
> {
  return new NonLiveLlmProviderUnavailableError({
    category: "provider_unavailable",
    missingEnvVar: "OPENROUTER_API_KEY",
    message: "OPENROUTER_API_KEY is required for non-live LLM flows."
  });
}

function createUnavailableHiddenEvaluationEngine(
  failure: NonLiveLlmFailure
): HiddenEvaluationEngine {
  return {
    evaluateEndedSession() {
      return Effect.succeed({
        status: "insufficient-evidence",
        reason: mapNonLiveLlmFailureToHiddenEvaluationReason(failure)
      });
    }
  };
}

function toOpenRouterProviderError(
  cause: unknown
): OpenRouterProviderError | null {
  if (cause instanceof OpenRouterProviderError) {
    return cause;
  }

  if (
    cause instanceof PersonaGenerationProviderError &&
    cause.cause instanceof OpenRouterProviderError
  ) {
    return cause.cause;
  }

  return null;
}

function unwrapStartSessionCause(cause: unknown): unknown {
  if (
    cause instanceof StartPracticePersonaGenerationError ||
    cause instanceof StartPracticeSessionSourceError
  ) {
    return cause.cause;
  }

  return cause;
}
