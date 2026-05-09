import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

const {
  getSupabaseLearnerEntryContext,
  createSessionOrchestrator,
  createReportGenerationCoordinator
} = vi.hoisted(() => ({
  getSupabaseLearnerEntryContext: vi.fn(),
  createSessionOrchestrator: vi.fn(),
  createReportGenerationCoordinator: vi.fn()
}));

vi.mock("@/src/infrastructure/supabase/learner-entry-context", () => ({
  getSupabaseLearnerEntryContext
}));

vi.mock("@/src/application/end-session/session-orchestrator", () => ({
  createSessionOrchestrator
}));

vi.mock("@/src/application/generate-report/report-generation-coordinator", () => ({
  createReportGenerationCoordinator
}));

import { getLearnerSessionRuntime } from "../src/application/start-session/practice-entry-seam";

describe("Learner session runtime seam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated when Learner entry context is not signed in", async () => {
    getSupabaseLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(getLearnerSessionRuntime()).resolves.toEqual({
      ok: false,
      reason: "unauthenticated"
    });
  });

  it("returns learner-scoped runtime actions for authenticated learners", async () => {
    const endSessionForLearner = vi.fn(() =>
      Effect.succeed({
        nextPath: "/dashboard",
        sessionStatus: "ended" as const,
        endedReason: "user-quit" as const,
        reportStatus: "insufficient-evidence" as const
      })
    );
    const runReportGeneratingFlowForLearner = vi.fn(() =>
      Effect.succeed({
        reportStatus: "ready" as const,
        nextPath: "/practice/session-case-1/report"
      })
    );

    getSupabaseLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-42",
      idealCustomerProfileRepository: {} as never,
      generatedSessionCaseRepository: {} as never
    });
    createReportGenerationCoordinator.mockReturnValue({});
    createSessionOrchestrator.mockReturnValue({
      endSessionForLearner,
      runReportGeneratingFlowForLearner
    });

    const runtime = await getLearnerSessionRuntime();
    expect(runtime.ok).toBe(true);
    if (!runtime.ok) {
      throw new Error("expected authenticated runtime");
    }

    await expect(
      runtime.endSessionForLearner({
        sessionId: "session-case-1",
        reason: "user-quit"
      })
    ).resolves.toEqual({
      nextPath: "/dashboard",
      sessionStatus: "ended",
      endedReason: "user-quit",
      reportStatus: "insufficient-evidence"
    });
    await expect(
      runtime.runReportGeneratingFlowForLearner({
        sessionId: "session-case-1"
      })
    ).resolves.toEqual({
      reportStatus: "ready",
      nextPath: "/practice/session-case-1/report"
    });

    expect(endSessionForLearner).toHaveBeenCalledWith({
      learnerId: "learner-42",
      sessionId: "session-case-1",
      reason: "user-quit"
    });
    expect(runReportGeneratingFlowForLearner).toHaveBeenCalledWith({
      learnerId: "learner-42",
      sessionId: "session-case-1"
    });
  });
});
