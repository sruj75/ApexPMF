import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEntryFailure } from "../src/application/start-session/entry-failure";
import { startPracticeAction } from "../app/practice/actions";

const {
  redirect,
  getLearnerEntryContext,
  startPracticeFromEntryContext,
  createOpenRouterChatClient,
  createSupabaseServerClient
} = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  getLearnerEntryContext: vi.fn(),
  startPracticeFromEntryContext: vi.fn(),
  createOpenRouterChatClient: vi.fn(),
  createSupabaseServerClient: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/src/application/start-session/practice-entry-seam", () => ({
  getLearnerEntryContext,
  startPracticeFromEntryContext
}));

vi.mock("@/src/infrastructure/llm/openrouter", () => ({
  createOpenRouterChatClient
}));

vi.mock("@/src/infrastructure/supabase/server", () => ({
  createSupabaseServerClient
}));

describe("Start Practice action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated Learners to /login", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(startPracticeAction(new FormData())).rejects.toThrow(
      "REDIRECT:/login"
    );
    expect(startPracticeFromEntryContext).not.toHaveBeenCalled();
  });

  it("preserves session creation failure redirect behavior", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      supabase: {}
    });
    startPracticeFromEntryContext.mockResolvedValue({
      ok: false,
      failure: createEntryFailure({
        category: "provider_failure",
        cause: new Error("badness")
      })
    });

    await expect(startPracticeAction(new FormData())).rejects.toThrow(
      "REDIRECT:/practice?error=session_creation_failed"
    );
  });

  it("keeps infrastructure wiring out of the UI action layer", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      supabase: {}
    });
    startPracticeFromEntryContext.mockResolvedValue({
      ok: true,
      sessionId: "session-case-abc"
    });

    await expect(startPracticeAction(new FormData())).rejects.toThrow(
      "REDIRECT:/practice/session-case-abc"
    );

    expect(createOpenRouterChatClient).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("redirects to the created Session on success", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      supabase: {}
    });
    startPracticeFromEntryContext.mockResolvedValue({
      ok: true,
      sessionId: "session-case-abc"
    });

    await expect(startPracticeAction(new FormData())).rejects.toThrow(
      "REDIRECT:/practice/session-case-abc"
    );
  });
});
