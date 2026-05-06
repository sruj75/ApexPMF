import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLearnerEntryContext,
  startPracticeFromEntryContext
} from "../src/application/start-session/practice-entry-seam";

const { getSupabaseLearnerEntryContext, startPracticeForLearner } = vi.hoisted(
  () => ({
    getSupabaseLearnerEntryContext: vi.fn(),
    startPracticeForLearner: vi.fn()
  })
);

vi.mock("@/src/infrastructure/supabase/learner-entry-context", () => ({
  getSupabaseLearnerEntryContext
}));

vi.mock("@/src/application/start-session/start-practice", () => ({
  startPracticeForLearner
}));

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
    startPracticeForLearner.mockResolvedValue({
      sessionId: "session-case-123"
    });

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
    startPracticeForLearner.mockRejectedValue(new Error("downstream failure"));

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
});
