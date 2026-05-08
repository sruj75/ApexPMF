import { beforeEach, describe, expect, it, vi } from "vitest";
import { endSessionAction } from "../app/practice/[sessionId]/actions";

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

describe("End Session action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated Learners to /login", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    const formData = new FormData();
    formData.set("sessionId", "session-case-abc");

    await expect(endSessionAction(formData)).rejects.toThrow("REDIRECT:/login");
  });

  it("delegates user quit to Session Orchestrator and redirects to Practice Dashboard", async () => {
    const endSessionForLearner = vi.fn(async () => ({
      nextPath: "/dashboard",
      sessionStatus: "ended",
      endedReason: "user-quit",
      reportStatus: "not-requested"
    }));

    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: {},
      generatedSessionCaseRepository: {}
    });
    createSessionOrchestrator.mockReturnValue({
      endSessionForLearner
    });

    const formData = new FormData();
    formData.set("sessionId", "session-case-abc");

    await expect(endSessionAction(formData)).rejects.toThrow("REDIRECT:/dashboard");
    expect(endSessionForLearner).toHaveBeenCalledWith({
      learnerId: "learner-1",
      sessionId: "session-case-abc",
      reason: "user-quit"
    });
  });
});
