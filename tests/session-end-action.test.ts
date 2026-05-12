import { beforeEach, describe, expect, it, vi } from "vitest";
import { endSessionAction } from "../app/practice/[sessionId]/actions";

const { redirect, getLearnerSessionRuntime } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  getLearnerSessionRuntime: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/src/application/start-session/practice-entry-web-adapter", () => ({
  getLearnerSessionRuntime
}));

describe("End Session action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to practice on missing sessionId instead of throwing", async () => {
    const formData = new FormData();

    await expect(endSessionAction(formData)).rejects.toThrow(
      "REDIRECT:/practice?error=session_creation_failed"
    );
    expect(getLearnerSessionRuntime).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated Learners to /login", async () => {
    getLearnerSessionRuntime.mockResolvedValue({
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

    getLearnerSessionRuntime.mockResolvedValue({
      ok: true,
      endSessionForLearner,
      runReportGeneratingFlowForLearner: vi.fn()
    });

    const formData = new FormData();
    formData.set("sessionId", "session-case-abc");

    await expect(endSessionAction(formData)).rejects.toThrow("REDIRECT:/dashboard");
    expect(endSessionForLearner).toHaveBeenCalledWith({
      sessionId: "session-case-abc",
      reason: "user-quit"
    });
  });
});
