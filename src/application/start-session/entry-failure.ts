import type { SupabaseRowDecodeError } from "@/src/infrastructure/supabase/supabase-row-decode-error";
import { OpenRouterProviderError } from "@/src/infrastructure/llm/openrouter";
import {
  PersonaGenerationDecodeError,
  PersonaGenerationProviderError
} from "@/src/domain/persona/persona-generation";
import {
  IdealCustomerProfileRepositoryDecodeError,
  IdealCustomerProfileRepositoryNotFoundError,
  IdealCustomerProfileRepositoryPersistenceError
} from "@/src/domain/persona/ideal-customer-profile-repository";
import { SessionSourceResolutionError } from "@/src/domain/persona/session-source";
import { NonLiveLlmProviderUnavailableError } from "@/src/application/non-live-llm-policy";
import {
  GeneratedSessionCaseRepositoryDecodeError,
  GeneratedSessionCaseRepositoryPersistenceError
} from "@/src/domain/session/generated-session-case-repository";

export type EntryFailureCategory =
  | "input_invalid"
  | "auth_missing"
  | "provider_failure"
  | "decode_failure"
  | "persistence_failure";

export class EntryFailure extends Error {
  readonly name = "EntryFailure";
  readonly category: EntryFailureCategory;
  readonly cause?: unknown;
  readonly details?: string[];

  constructor(input: {
    category: EntryFailureCategory;
    message?: string;
    cause?: unknown;
    details?: string[];
  }) {
    super(input.message ?? defaultMessageForCategory(input.category));
    this.category = input.category;
    this.cause = input.cause;
    this.details = input.details;
  }
}

export function createEntryFailure(input: {
  category: EntryFailureCategory;
  message?: string;
  cause?: unknown;
  details?: string[];
}): EntryFailure {
  return new EntryFailure(input);
}

export function classifyEntryFailure(cause: unknown): EntryFailure {
  if (cause instanceof EntryFailure) {
    return cause;
  }

  if (cause instanceof NonLiveLlmProviderUnavailableError) {
    return createEntryFailure({
      category: "provider_failure",
      message: cause.message,
      cause
    });
  }

  if (isOpenRouterProviderError(cause)) {
    return createEntryFailure({
      category: "provider_failure",
      message: cause.message,
      cause,
      details: [
        `phase=${cause.phase}`,
        cause.status ? `status=${cause.status}` : "",
        cause.statusText ? `statusText=${cause.statusText}` : ""
      ].filter((detail) => detail.length > 0)
    });
  }

  if (isPersonaGenerationDecodeError(cause)) {
    return createEntryFailure({
      category: "decode_failure",
      message: cause.message,
      cause,
      details: [`reason=${cause.reason}`]
    });
  }

  if (isPersonaGenerationProviderError(cause)) {
    const providerCause = cause.cause;
    if (isOpenRouterProviderError(providerCause)) {
      return createEntryFailure({
        category: "provider_failure",
        message: providerCause.message,
        cause: providerCause,
        details: [
          `phase=${providerCause.phase}`,
          providerCause.status ? `status=${providerCause.status}` : "",
          providerCause.statusText ? `statusText=${providerCause.statusText}` : ""
        ].filter((detail) => detail.length > 0)
      });
    }

    return createEntryFailure({
      category: "provider_failure",
      message: cause.message,
      cause
    });
  }

  if (isSessionSourceResolutionError(cause)) {
    if (isIdealCustomerProfileRepositoryError(cause.cause)) {
      return classifyEntryFailure(cause.cause);
    }
  }

  if (isGeneratedSessionCaseRepositoryDecodeError(cause)) {
    return createEntryFailure({
      category: "decode_failure",
      message: "Generated Session Case decode failed.",
      cause,
      details: [`operation=${cause.operation}`]
    });
  }

  if (isGeneratedSessionCaseRepositoryPersistenceError(cause)) {
    return createEntryFailure({
      category: "persistence_failure",
      message: "Generated Session Case persistence failed.",
      cause,
      details: [`operation=${cause.operation}`]
    });
  }

  if (isIdealCustomerProfileRepositoryDecodeError(cause)) {
    return createEntryFailure({
      category: "decode_failure",
      message: "Ideal Customer Profile decode failed.",
      cause,
      details: [
        `adapter=${cause.cause.adapter}`,
        `operation=${cause.cause.operation}`,
        ...(typeof cause.cause.rowIndex === "number"
          ? [`rowIndex=${cause.cause.rowIndex}`]
          : []),
        ...cause.cause.details
      ]
    });
  }

  if (isIdealCustomerProfileRepositoryPersistenceError(cause)) {
    return createEntryFailure({
      category: "persistence_failure",
      message: "Ideal Customer Profile persistence failed.",
      cause,
      details: [`operation=${cause.operation}`]
    });
  }

  if (isIdealCustomerProfileRepositoryNotFoundError(cause)) {
    return createEntryFailure({
      category: "persistence_failure",
      message: "Ideal Customer Profile was not found.",
      cause,
      details: [`operation=${cause.operation}`, `profileId=${cause.profileId}`]
    });
  }

  if (isSupabaseRowDecodeError(cause)) {
    return createEntryFailure({
      category: "persistence_failure",
      message: cause.message,
      cause,
      details: [
        `adapter=${cause.adapter}`,
        `operation=${cause.operation}`,
        ...(typeof cause.rowIndex === "number"
          ? [`rowIndex=${cause.rowIndex}`]
          : []),
        ...cause.details
      ]
    });
  }

  if (cause instanceof Error && cause.message.includes("OPENROUTER_API_KEY")) {
    return createEntryFailure({
      category: "provider_failure",
      message: cause.message,
      cause
    });
  }

  return createEntryFailure({
    category: "persistence_failure",
    cause
  });
}

export function mapStartPracticeFailureToRedirectPath(
  failure: EntryFailure
): string {
  switch (failure.category) {
    case "auth_missing":
      return "/login";
    case "provider_failure":
    case "decode_failure":
    case "persistence_failure":
    case "input_invalid":
      return "/practice?error=session_creation_failed";
    default:
      return assertNever(failure.category);
  }
}

export function mapProfileFailureToRedirectPath(failure: EntryFailure): string {
  switch (failure.category) {
    case "auth_missing":
      return "/login";
    case "input_invalid":
      return `/profile?${new URLSearchParams({ error: (failure.details ?? []).join(" ") }).toString()}`;
    case "provider_failure":
    case "decode_failure":
    case "persistence_failure":
      throw failure;
    default:
      return assertNever(failure.category);
  }
}

function defaultMessageForCategory(category: EntryFailureCategory): string {
  switch (category) {
    case "input_invalid":
      return "Entry input is invalid.";
    case "auth_missing":
      return "Learner authentication is missing.";
    case "provider_failure":
      return "Provider request failed at entry seam.";
    case "decode_failure":
      return "Provider response decode failed at entry seam.";
    case "persistence_failure":
      return "Persistence failed at entry seam.";
    default:
      return assertNever(category);
  }
}

function isOpenRouterProviderError(
  value: unknown
): value is OpenRouterProviderError {
  return value instanceof OpenRouterProviderError;
}

function isPersonaGenerationDecodeError(
  value: unknown
): value is PersonaGenerationDecodeError {
  return value instanceof PersonaGenerationDecodeError;
}

function isPersonaGenerationProviderError(
  value: unknown
): value is PersonaGenerationProviderError {
  return value instanceof PersonaGenerationProviderError;
}

function isGeneratedSessionCaseRepositoryDecodeError(
  value: unknown
): value is GeneratedSessionCaseRepositoryDecodeError {
  return isTaggedError(value, "GeneratedSessionCaseRepositoryDecodeError");
}

function isGeneratedSessionCaseRepositoryPersistenceError(
  value: unknown
): value is GeneratedSessionCaseRepositoryPersistenceError {
  return isTaggedError(value, "GeneratedSessionCaseRepositoryPersistenceError");
}

function isSessionSourceResolutionError(
  value: unknown
): value is SessionSourceResolutionError {
  return value instanceof SessionSourceResolutionError;
}

function isIdealCustomerProfileRepositoryError(
  value: unknown
): value is
  | IdealCustomerProfileRepositoryDecodeError
  | IdealCustomerProfileRepositoryPersistenceError
  | IdealCustomerProfileRepositoryNotFoundError {
  return (
    isIdealCustomerProfileRepositoryDecodeError(value) ||
    isIdealCustomerProfileRepositoryPersistenceError(value) ||
    isIdealCustomerProfileRepositoryNotFoundError(value)
  );
}

function isIdealCustomerProfileRepositoryDecodeError(
  value: unknown
): value is IdealCustomerProfileRepositoryDecodeError {
  return isTaggedError(value, "IdealCustomerProfileRepositoryDecodeError");
}

function isIdealCustomerProfileRepositoryPersistenceError(
  value: unknown
): value is IdealCustomerProfileRepositoryPersistenceError {
  return isTaggedError(value, "IdealCustomerProfileRepositoryPersistenceError");
}

function isIdealCustomerProfileRepositoryNotFoundError(
  value: unknown
): value is IdealCustomerProfileRepositoryNotFoundError {
  return isTaggedError(value, "IdealCustomerProfileRepositoryNotFoundError");
}

function isSupabaseRowDecodeError(
  value: unknown
): value is SupabaseRowDecodeError {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    value.name === "SupabaseRowDecodeError"
  );
}

function isTaggedError<Tag extends string>(
  value: unknown,
  tag: Tag
): value is { _tag: Tag } {
  return (
    typeof value === "object" &&
    value !== null &&
    "_tag" in value &&
    value._tag === tag
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled entry failure category: ${String(value)}`);
}
