import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

const {
  getSupabaseLearnerEntryContextEffect,
  createSessionOrchestrator,
  createReportGenerationCoordinator,
  createProgressionUpdater,
  SessionCaseNotFoundError
} = vi.hoisted(() => ({
  getSupabaseLearnerEntryContextEffect: vi.fn(),
  createSessionOrchestrator: vi.fn(),
  createReportGenerationCoordinator: vi.fn(),
  createProgressionUpdater: vi.fn(),
  SessionCaseNotFoundError: class SessionCaseNotFoundError extends Error {}
}));

vi.mock("@/src/infrastructure/supabase/learner-entry-context", () => ({
  getSupabaseLearnerEntryContextEffect
}));

vi.mock("@/src/application/end-session/session-orchestrator", () => ({
  createSessionOrchestrator,
  SessionCaseNotFoundError
}));

vi.mock("@/src/application/generate-report/report-generation-coordinator", () => ({
  createReportGenerationCoordinator
}));

vi.mock("@/src/application/update-progression/progression-updater", () => ({
  createProgressionUpdater
}));

import { getLearnerSessionRuntime } from "../src/application/start-session/practice-entry-web-adapter";

describe("Learner session runtime seam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated when Learner entry context is not signed in", async () => {
    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );

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

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-42",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {} as never
      })
    );
    const reportGenerationCoordinator = {};
    createReportGenerationCoordinator.mockReturnValue(reportGenerationCoordinator);
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
    expect(createSessionOrchestrator).toHaveBeenCalledWith(
      expect.objectContaining({
        generatedSessionCaseRepository: {},
        reportGenerationCoordinator
      })
    );
  });

  it("wires progressionUpdater into the session orchestrator", async () => {
    const progressionUpdater = { applyCompletedSession: vi.fn() };
    createProgressionUpdater.mockReturnValue(progressionUpdater);

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-42",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {} as never
      })
    );
    createReportGenerationCoordinator.mockReturnValue({});
    createSessionOrchestrator.mockReturnValue({
      endSessionForLearner: vi.fn(),
      runReportGeneratingFlowForLearner: vi.fn()
    });

    await getLearnerSessionRuntime();

    expect(createSessionOrchestrator).toHaveBeenCalledWith(
      expect.objectContaining({
        progressionUpdater
      })
    );
  });

  it("maps report-generating missing-session errors into boundary not-found outcomes", async () => {
    const endSessionForLearner = vi.fn(() =>
      Effect.succeed({
        nextPath: "/dashboard",
        sessionStatus: "ended" as const,
        endedReason: "user-quit" as const,
        reportStatus: "not-requested" as const
      })
    );
    const runReportGeneratingFlowForLearner = vi.fn(() =>
      Effect.fail(new SessionCaseNotFoundError())
    );

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-42",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {} as never
      })
    );
    createReportGenerationCoordinator.mockReturnValue({});
    createSessionOrchestrator.mockReturnValue({
      endSessionForLearner,
      runReportGeneratingFlowForLearner
    });

    const runtime = await getLearnerSessionRuntime();
    if (!runtime.ok) {
      throw new Error("expected authenticated runtime");
    }

    await expect(
      runtime.runReportGeneratingFlowForLearner({
        sessionId: "session-case-missing"
      })
    ).resolves.toEqual({
      reportStatus: "not-found"
    });
  });
});
