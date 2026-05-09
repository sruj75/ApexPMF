import {
  classifyEntryFailure,
  createEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import { createOpenRouterPersonaGenerator } from "@/src/domain/persona/openrouter-persona-generator";
import type { PersonaGenerator } from "@/src/domain/persona/persona-generation";
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

const defaultOpenRouterModel = "openrouter/free";
const defaultOpenRouterAppTitle = "The Mom Test Simulator";

export type NonLiveLlmFailure =
  | {
      category: "provider_unavailable";
      missingEnvVar: "OPENROUTER_API_KEY";
      message: string;
    }
  | {
      category: "provider_failure";
      message: string;
      phase: OpenRouterProviderError["phase"];
      status?: number;
      statusText?: string;
      cause: OpenRouterProviderError;
    };

export type NonLiveLlmAccess =
  | {
      status: "available";
      provider: "openrouter";
      configuration: {
        model: string;
        siteUrl?: string;
        appTitle: string;
      };
      chatClient: OpenRouterChatClient;
    }
  | {
      status: "unavailable";
      failure: Extract<NonLiveLlmFailure, { category: "provider_unavailable" }>;
    };

export type NonLiveLlmRuntimePolicy = {
  composePersonaGenerator(): PersonaGenerator;
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
      if (nonLiveLlmAccess.status === "unavailable") {
        throw mapNonLiveLlmFailureToEntryFailure(nonLiveLlmAccess.failure);
      }

      return personaGeneratorFactory({
        chatClient: nonLiveLlmAccess.chatClient
      });
    },
    composeHiddenEvaluationEngine() {
      if (nonLiveLlmAccess.status === "unavailable") {
        return createUnavailableHiddenEvaluationEngine(nonLiveLlmAccess.failure);
      }

      return hiddenEvaluationEngineFactory({
        judge: createOpenRouterHiddenEvaluationJudge({
          chatClient: nonLiveLlmAccess.chatClient
        })
      });
    },
    mapStartSessionFailure(cause) {
      const nonLiveLlmFailure = classifyNonLiveLlmFailure(cause);
      return nonLiveLlmFailure
        ? mapNonLiveLlmFailureToEntryFailure(nonLiveLlmFailure)
        : classifyEntryFailure(cause);
    }
  };
}

export function resolveNonLiveLlmAccess(
  env: NodeJS.ProcessEnv = process.env
): NonLiveLlmAccess {
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      status: "unavailable",
      failure: missingOpenRouterApiKeyFailure()
    };
  }

  const model = env.OPENROUTER_MODEL ?? defaultOpenRouterModel;
  const siteUrl = env.OPENROUTER_SITE_URL;
  const appTitle = env.OPENROUTER_APP_TITLE ?? defaultOpenRouterAppTitle;

  return {
    status: "available",
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
  };
}

export function classifyNonLiveLlmFailure(
  cause: unknown
): Extract<NonLiveLlmFailure, { category: "provider_failure" }> | null {
  if (!(cause instanceof OpenRouterProviderError)) {
    return null;
  }

  return {
    category: "provider_failure",
    message: cause.message,
    phase: cause.phase,
    status: cause.status,
    statusText: cause.statusText,
    cause
  };
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
  { category: "provider_unavailable" }
> {
  return {
    category: "provider_unavailable",
    missingEnvVar: "OPENROUTER_API_KEY",
    message: "OPENROUTER_API_KEY is required for non-live LLM flows."
  };
}

function createUnavailableHiddenEvaluationEngine(
  failure: NonLiveLlmFailure
): HiddenEvaluationEngine {
  return {
    async evaluateEndedSession() {
      return {
        status: "insufficient-evidence",
        reason: mapNonLiveLlmFailureToHiddenEvaluationReason(failure)
      };
    }
  };
}
