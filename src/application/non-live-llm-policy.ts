import {
  createEntryFailure,
  type EntryFailure
} from "@/src/application/start-session/entry-failure";
import { PersonaGenerationProviderError } from "@/src/domain/persona/persona-generation";
import type { SessionEvaluationInsufficientReason } from "@/src/domain/session/session-evaluation";
import {
  createOpenRouterChatClient,
  OpenRouterProviderError,
  type OpenRouterChatClient
} from "@/src/infrastructure/llm/openrouter";
import { PRODUCT_APP_NAME } from "@/src/product/brand";
import { Data, Effect } from "effect";

const defaultOpenRouterModel = "openrouter/free";
const defaultOpenRouterAppTitle = PRODUCT_APP_NAME;

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
