import { describe, expect, it } from "vitest";
import {
  classifyEntryFailure,
  createEntryFailure,
  mapProfileFailureToRedirectPath,
  mapStartPracticeFailureToRedirectPath
} from "../src/application/start-session/entry-failure";
import { PersonaGenerationDecodeError } from "../src/domain/persona/openrouter-persona-generator";
import { OpenRouterProviderError } from "../src/infrastructure/llm/openrouter";
import { SupabaseRowDecodeError } from "../src/infrastructure/supabase/supabase-row-decode-error";
import { StartPracticeInsufficientCreditsError } from "../src/application/start-session/start-practice";

describe("Entry failure seam", () => {
  it("classifies OpenRouter provider transport errors as provider_failure", () => {
    const failure = classifyEntryFailure(
      new OpenRouterProviderError({
        phase: "request_failed",
        status: 429,
        statusText: "Too Many Requests",
        message: "OpenRouter request failed: 429 Too Many Requests"
      })
    );

    expect(failure.category).toBe("provider_failure");
    expect(mapStartPracticeFailureToRedirectPath(failure)).toBe(
      "/practice?error=session_creation_failed"
    );
  });

  it("classifies Persona Generation contract failures as decode_failure", () => {
    const failure = classifyEntryFailure(
      new PersonaGenerationDecodeError({
        reason: "schema_validation_failed",
        message: "Persona Generation response failed schema validation."
      })
    );

    expect(failure.category).toBe("decode_failure");
    expect(mapStartPracticeFailureToRedirectPath(failure)).toBe(
      "/practice?error=session_creation_failed"
    );
  });

  it("classifies Supabase row decode failures as persistence_failure", () => {
    const failure = classifyEntryFailure(
      new SupabaseRowDecodeError({
        adapter: "ideal_customer_profiles",
        operation: "listForLearner",
        rowIndex: 1,
        details: ["expected created_at as Date"]
      })
    );

    expect(failure.category).toBe("persistence_failure");
    expect(mapStartPracticeFailureToRedirectPath(failure)).toBe(
      "/practice?error=session_creation_failed"
    );
  });

  it("classifies insufficient Credits as insufficient_credits and redirects to dashboard", () => {
    const failure = classifyEntryFailure(
      new StartPracticeInsufficientCreditsError({
        learnerId: "learner-1",
        availableCredits: 0,
        minimumRequired: 1
      })
    );

    expect(failure.category).toBe("insufficient_credits");
    expect(mapStartPracticeFailureToRedirectPath(failure)).toBe(
      "/dashboard?error=insufficient_credits"
    );
  });

  it("maps auth and input failures to profile redirects", () => {
    expect(
      mapProfileFailureToRedirectPath(
        createEntryFailure({
          category: "auth_missing"
        })
      )
    ).toBe("/login");
    expect(
      mapProfileFailureToRedirectPath(
        createEntryFailure({
          category: "input_invalid",
          details: ["Name is required."]
        })
      )
    ).toBe("/profile?error=Name+is+required.");
  });
});
