import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLearnerEntryContext,
  startPracticeFromEntryContext
} from "../src/application/start-session/practice-entry-seam";
import type { NonLiveLlmRuntimePolicy } from "../src/application/non-live-llm-policy";
import { createEntryFailure } from "../src/application/start-session/entry-failure";
import { OpenRouterProviderError } from "../src/infrastructure/llm/openrouter";
import { Effect } from "effect";

const { getSupabaseLearnerEntryContext, startPracticeForLearner } = vi.hoisted(
  () => ({
    getSupabaseLearnerEntryContext: vi.fn(),
    startPracticeForLearner: vi.fn()
  })
);

vi.mock("@/src/infrastructure/supabase/learner-entry-context", () => ({
  getSupabaseLearnerEntryContext
}));

vi.mock("@/src/application/start-session/start-practice", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/src/application/start-session/start-practice")
  >();
  return {
    ...actual,
    startPracticeForLearner
  };
});

const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY;

describe("Practice entry seam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  afterAll(() => {
    process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey;
  });

  it("returns an unauthenticated context result when no Learner is signed in", async () => {
    getSupabaseLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(getLearnerEntryContext()).resolves.toEqual({
      ok: false,
      reason: "unauthenticated"
    });
  });

  it("returns a started Session id when Start Practice succeeds", async () => {
    process.env.OPENROUTER_API_KEY = "openrouter-key";
    startPracticeForLearner.mockReturnValue(
      Effect.succeed({
        sessionId: "session-case-123"
      })
    );

    const result = await startPracticeFromEntryContext({
      learnerId: "learner-1",
      idealCustomerProfileRepository: {} as never,
      generatedSessionCaseRepository: {} as never
    });

    expect(result).toEqual({
      ok: true,
      sessionId: "session-case-123"
    });
    expect(startPracticeForLearner).toHaveBeenCalledWith(
      "learner-1",
      expect.objectContaining({
        idealCustomerProfileRepository: expect.any(Object),
        generatedSessionCaseRepository: expect.any(Object),
        personaGenerator: expect.any(Object)
      })
    );
  });

  it("maps Persona Generator env misconfiguration to provider_failure", async () => {
    const result = await startPracticeFromEntryContext({
      learnerId: "learner-2",
      idealCustomerProfileRepository: {} as never,
      generatedSessionCaseRepository: {} as never
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.category).toBe("provider_failure");
      expect(result.failure.cause).toBeUndefined();
      expect(result.failure.message).toContain("OPENROUTER_API_KEY");
    }
  });

  it("maps downstream Start Practice failures to persistence_failure by default", async () => {
    process.env.OPENROUTER_API_KEY = "openrouter-key";
    startPracticeForLearner.mockReturnValue(
      Effect.fail(new Error("downstream failure"))
    );

    const result = await startPracticeFromEntryContext({
      learnerId: "learner-3",
      idealCustomerProfileRepository: {} as never,
      generatedSessionCaseRepository: {} as never
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.category).toBe("persistence_failure");
      expect(result.failure.cause).toBeInstanceOf(Error);
      expect((result.failure.cause as Error).message).toBe("downstream failure");
    }
  });

  it("maps typed OpenRouter provider failures to provider_failure", async () => {
    process.env.OPENROUTER_API_KEY = "openrouter-key";
    startPracticeForLearner.mockReturnValue(
      Effect.fail(
        new OpenRouterProviderError({
          phase: "request_failed",
          status: 503,
          statusText: "Service Unavailable",
          message: "OpenRouter request failed: 503 Service Unavailable"
        })
      )
    );

    const result = await startPracticeFromEntryContext({
      learnerId: "learner-4",
      idealCustomerProfileRepository: {} as never,
      generatedSessionCaseRepository: {} as never
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.category).toBe("provider_failure");
      expect(result.failure.details).toEqual([
        "phase=request_failed",
        "status=503",
        "statusText=Service Unavailable"
      ]);
    }
  });

  it("uses the injected non-live runtime policy contract for persona and failure mapping", async () => {
    const personaGenerator = {} as never;
    const mappedFailure = createEntryFailure({
      category: "input_invalid",
      message: "mapped by injected non-live policy"
    });
    const nonLiveLlmRuntimePolicy: NonLiveLlmRuntimePolicy = {
      composePersonaGenerator: () => Effect.succeed(personaGenerator),
      composeHiddenEvaluationEngine: () => ({
        evaluateEndedSession: () =>
          Effect.succeed({
          status: "insufficient-evidence",
          reason: "provider-failure"
        })
      }),
      mapStartSessionFailure: () => mappedFailure
    };
    startPracticeForLearner.mockReturnValue(
      Effect.fail(new Error("downstream failure"))
    );

    const result = await startPracticeFromEntryContext(
      {
        learnerId: "learner-5",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {} as never
      },
      { nonLiveLlmRuntimePolicy }
    );

    expect(startPracticeForLearner).toHaveBeenCalledWith(
      "learner-5",
      expect.objectContaining({
        personaGenerator
      })
    );
    expect(result).toEqual({
      ok: false,
      failure: mappedFailure
    });
  });
});
