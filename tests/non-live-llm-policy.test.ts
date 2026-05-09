import { describe, expect, it } from "vitest";
import {
  createNonLiveLlmRuntimePolicy,
  classifyNonLiveLlmFailure,
  type NonLiveLlmRuntimePolicy,
  mapNonLiveLlmFailureToEntryFailure,
  mapNonLiveLlmFailureToHiddenEvaluationReason,
  resolveNonLiveLlmAccess
} from "../src/application/non-live-llm-policy";
import { OpenRouterProviderError } from "../src/infrastructure/llm/openrouter";
import { Either, Effect } from "effect";

describe("Non-live LLM policy", () => {
  it("returns unavailable when OPENROUTER_API_KEY is missing", () => {
    const access = Effect.runSync(
      Effect.either(
        resolveNonLiveLlmAccess({
          OPENROUTER_MODEL: "openai/gpt-5.2"
        })
      )
    );
    if (!Either.isLeft(access)) {
      throw new Error("Expected unavailable non-live LLM access.");
    }

    expect(access.left).toMatchObject({
      category: "provider_unavailable",
      missingEnvVar: "OPENROUTER_API_KEY",
      message: "OPENROUTER_API_KEY is required for non-live LLM flows."
    });
  });

  it("returns available with configured or default OpenRouter settings", () => {
    const configuredAccess = Effect.runSync(
      resolveNonLiveLlmAccess({
        OPENROUTER_API_KEY: "openrouter-key",
        OPENROUTER_MODEL: "openai/gpt-5.2",
        OPENROUTER_SITE_URL: "https://example.com",
        OPENROUTER_APP_TITLE: "The Mom Test Simulator QA"
      })
    );

    expect(configuredAccess.provider).toBe("openrouter");
    expect(configuredAccess.configuration).toEqual({
      model: "openai/gpt-5.2",
      siteUrl: "https://example.com",
      appTitle: "The Mom Test Simulator QA"
    });
    expect(configuredAccess.chatClient).toEqual(
      expect.objectContaining({
        createStructuredJsonCompletion: expect.any(Function)
      })
    );

    const defaultedAccess = Effect.runSync(
      resolveNonLiveLlmAccess({
        OPENROUTER_API_KEY: "openrouter-key"
      })
    );
    expect(defaultedAccess.configuration).toEqual({
      model: "openrouter/free",
      siteUrl: undefined,
      appTitle: "The Mom Test Simulator"
    });
  });

  it("classifies provider errors and maps them to flow-specific typed failures", () => {
    const providerError = new OpenRouterProviderError({
      phase: "request_failed",
      status: 502,
      statusText: "Bad Gateway",
      message: "OpenRouter request failed: 502 Bad Gateway"
    });

    const providerFailure = classifyNonLiveLlmFailure(providerError);
    expect(providerFailure).toMatchObject({
      category: "provider_failure",
      message: "OpenRouter request failed: 502 Bad Gateway",
      phase: "request_failed",
      status: 502,
      statusText: "Bad Gateway",
      cause: providerError
    });
    if (!providerFailure) {
      throw new Error("Expected provider failure classification.");
    }
    expect(mapNonLiveLlmFailureToHiddenEvaluationReason(providerFailure)).toBe(
      "provider-failure"
    );

    const unavailableAccess = Effect.runSync(Effect.either(resolveNonLiveLlmAccess({})));
    if (!Either.isLeft(unavailableAccess)) {
      throw new Error("Expected unavailable non-live LLM access.");
    }

    const entryFailure = mapNonLiveLlmFailureToEntryFailure(unavailableAccess.left);
    expect(entryFailure.category).toBe("provider_failure");
    expect(entryFailure.message).toContain("OPENROUTER_API_KEY");

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

  it("composes persona generation and hidden evaluation from one available runtime policy", async () => {
    const personaGenerator = {
      generateSessionCase: () =>
        Effect.fail(new Error("not expected in this test") as never)
    };
    const hiddenEvaluationEngine = {
      evaluateEndedSession: () =>
        Effect.succeed({
          status: "insufficient-evidence" as const,
          reason: "provider-failure" as const
        })
    };
    const createPersonaGenerator = (input: { chatClient: unknown }) => {
      expect(input.chatClient).toEqual(
        expect.objectContaining({
          createStructuredJsonCompletion: expect.any(Function)
        })
      );
      return personaGenerator;
    };
    const createHiddenEvaluationEngine = (input: { judge: unknown }) => {
      expect(input.judge).toEqual(
        expect.objectContaining({
          createStructuredJsonCompletion: expect.any(Function)
        })
      );
      return hiddenEvaluationEngine;
    };

    const policy = createNonLiveLlmRuntimePolicy({
      env: {
        OPENROUTER_API_KEY: "openrouter-key"
      },
      createPersonaGenerator,
      createHiddenEvaluationEngine
    });

    await expect(
      Effect.runPromise(policy.composePersonaGenerator())
    ).resolves.toBe(personaGenerator);
    expect(policy.composeHiddenEvaluationEngine()).toBe(hiddenEvaluationEngine);
  });

  it("maps unavailable runtime policy to entry failure and hidden-evaluation fallback", async () => {
    const policy = createNonLiveLlmRuntimePolicy({
      env: {}
    });

    const personaGeneratorResult = await Effect.runPromise(
      Effect.either(policy.composePersonaGenerator())
    );
    expect(Either.isLeft(personaGeneratorResult)).toBe(true);
    if (Either.isLeft(personaGeneratorResult)) {
      expect(personaGeneratorResult.left).toMatchObject({
        category: "provider_unavailable",
        missingEnvVar: "OPENROUTER_API_KEY",
        message: "OPENROUTER_API_KEY is required for non-live LLM flows."
      });
    }

    const hiddenEvaluationEngine = policy.composeHiddenEvaluationEngine();
    await expect(
      Effect.runPromise(
        hiddenEvaluationEngine.evaluateEndedSession({
          generatedSessionCase: {} as never,
          transcript: []
        })
      )
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "provider-failure"
    });
  });

  it("maps start-session causes through the runtime policy contract", () => {
    const policy: NonLiveLlmRuntimePolicy = createNonLiveLlmRuntimePolicy({
      env: {
        OPENROUTER_API_KEY: "openrouter-key"
      }
    });

    const providerFailure = policy.mapStartSessionFailure(
      new OpenRouterProviderError({
        phase: "request_failed",
        status: 429,
        statusText: "Too Many Requests",
        message: "OpenRouter request failed: 429 Too Many Requests"
      })
    );
    expect(providerFailure.category).toBe("provider_failure");
    expect(providerFailure.details).toEqual([
      "phase=request_failed",
      "status=429",
      "statusText=Too Many Requests"
    ]);

    const persistenceFailure = policy.mapStartSessionFailure(
      new Error("downstream failure")
    );
    expect(persistenceFailure.category).toBe("persistence_failure");
  });
});
