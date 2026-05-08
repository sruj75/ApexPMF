import { beforeEach, describe, expect, it, vi } from "vitest";
import ReportGeneratingPage from "../app/practice/[sessionId]/report-generating/page";

const { redirect, getLearnerEntryContext, createSessionOrchestrator } = vi.hoisted(
  () => ({
    redirect: vi.fn((location: string) => {
      throw new Error(`REDIRECT:${location}`);
    }),
    getLearnerEntryContext: vi.fn(),
    createSessionOrchestrator: vi.fn()
  })
);

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/src/application/start-session/practice-entry-seam", () => ({
  getLearnerEntryContext
}));

vi.mock("@/src/application/end-session/session-orchestrator", () => ({
  createSessionOrchestrator
}));

describe("Report generating page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated learners to /login", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: "session-case-1"
        })
      })
    ).rejects.toThrow("REDIRECT:/login");
  });

  it("routes to Session Report when report output is ready", async () => {
    const runReportGeneratingFlowForLearner = vi.fn(async () => ({
      reportStatus: "ready",
      nextPath: "/practice/session-case-1/report"
    }));

    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {}
    });
    createSessionOrchestrator.mockReturnValue({
      runReportGeneratingFlowForLearner
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: "session-case-1"
        })
      })
    ).rejects.toThrow("REDIRECT:/practice/session-case-1/report");

    expect(runReportGeneratingFlowForLearner).toHaveBeenCalledWith({
      learnerId: "learner-1",
      sessionId: "session-case-1"
    });
  });

  it("routes to Practice Dashboard when report evidence is insufficient", async () => {
    const runReportGeneratingFlowForLearner = vi.fn(async () => ({
      reportStatus: "insufficient-evidence",
      nextPath: "/dashboard"
    }));

    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {}
    });
    createSessionOrchestrator.mockReturnValue({
      runReportGeneratingFlowForLearner
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: "session-case-1"
        })
      })
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
});
