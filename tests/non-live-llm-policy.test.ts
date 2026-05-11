import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  classifyNonLiveLlmFailure,
  mapNonLiveLlmFailureToEntryFailure,
  mapNonLiveLlmFailureToHiddenEvaluationReason,
  resolveNonLiveLlmAccess
} from "../src/application/non-live-llm-policy";
import { OpenRouterProviderError } from "../src/infrastructure/llm/openrouter";

describe("Non-live LLM policy", () => {
  it("returns typed unavailable failure when OPENROUTER_API_KEY is missing", async () => {
    const result = await Effect.runPromise(
      resolveNonLiveLlmAccess({
        OPENROUTER_MODEL: "openai/gpt-5.2"
      }).pipe(Effect.either)
    );

    expect(result._tag).toBe("Left");
    if (result._tag !== "Left") {
      throw new Error("Expected unavailable non-live LLM access.");
    }
    expect(result.left).toMatchObject({
      _tag: "NonLiveLlmProviderUnavailableError",
      category: "provider_unavailable",
      missingEnvVar: "OPENROUTER_API_KEY"
    });
  });

  it("returns available access with configured or default OpenRouter settings", async () => {
    const configuredResult = await Effect.runPromise(
      resolveNonLiveLlmAccess({
        OPENROUTER_API_KEY: "openrouter-key",
        OPENROUTER_MODEL: "openai/gpt-5.2",
        OPENROUTER_SITE_URL: "https://example.com",
        OPENROUTER_APP_TITLE: "The Mom Test Simulator QA"
      }).pipe(Effect.either)
    );

    expect(configuredResult._tag).toBe("Right");
    if (configuredResult._tag !== "Right") {
      throw new Error("Expected available non-live LLM access.");
    }
    expect(configuredResult.right.configuration).toEqual({
      model: "openai/gpt-5.2",
      siteUrl: "https://example.com",
      appTitle: "The Mom Test Simulator QA"
    });

    const defaultedResult = await Effect.runPromise(
      resolveNonLiveLlmAccess({
        OPENROUTER_API_KEY: "openrouter-key"
      }).pipe(Effect.either)
    );
    expect(defaultedResult._tag).toBe("Right");
    if (defaultedResult._tag !== "Right") {
      throw new Error("Expected available access with defaults.");
    }
    expect(defaultedResult.right.configuration).toEqual({
      model: "openrouter/free",
      siteUrl: undefined,
      appTitle: "The Mom Test Simulator"
    });
  });

  it("classifies provider failures and maps them to flow-specific typed failures", () => {
    const providerError = new OpenRouterProviderError({
      phase: "request_failed",
      status: 502,
      statusText: "Bad Gateway",
      message: "OpenRouter request failed: 502 Bad Gateway"
    });

    const providerFailure = classifyNonLiveLlmFailure(providerError);
    expect(providerFailure).toMatchObject({
      _tag: "NonLiveLlmProviderFailureError",
      category: "provider_failure",
      phase: "request_failed",
      status: 502,
      statusText: "Bad Gateway"
    });
    if (!providerFailure) {
      throw new Error("Expected provider failure classification.");
    }
    expect(mapNonLiveLlmFailureToHiddenEvaluationReason(providerFailure)).toBe(
      "provider-failure"
    );

    const mappedEntryProviderFailure = mapNonLiveLlmFailureToEntryFailure(
      providerFailure
    );
    expect(mappedEntryProviderFailure.category).toBe("provider_failure");
    expect(mappedEntryProviderFailure.details).toEqual([
      "phase=request_failed",
      "status=502",
      "statusText=Bad Gateway"
    ]);
  });

});
