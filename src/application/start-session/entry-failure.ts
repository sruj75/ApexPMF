import type { SupabaseRowDecodeError } from "@/src/infrastructure/supabase/supabase-row-decode-error";
import type { OpenRouterProviderError } from "@/src/infrastructure/llm/openrouter";
import type { PersonaGenerationDecodeError } from "@/src/domain/persona/openrouter-persona-generator";

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
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    value.name === "OpenRouterProviderError"
  );
}

function isPersonaGenerationDecodeError(
  value: unknown
): value is PersonaGenerationDecodeError {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    value.name === "PersonaGenerationDecodeError"
  );
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

function assertNever(value: never): never {
  throw new Error(`Unhandled entry failure category: ${String(value)}`);
}
