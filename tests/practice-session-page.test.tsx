import { beforeEach, describe, expect, it, vi } from "vitest";
import PracticeSessionPage from "../app/practice/[sessionId]/page";
import { defaultPracticeSessionId } from "./support/generated-session-case-fixture";

const {
  redirect,
  notFound,
  resolvePracticeRouteDecision,
  SessionStartView
} = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  resolvePracticeRouteDecision: vi.fn(),
  SessionStartView: vi.fn(() => null)
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound
}));

vi.mock("@/src/application/practice-route/practice-route-decision", () => ({
  resolvePracticeRouteDecision
}));

vi.mock("../app/practice/[sessionId]/session-start-view", () => ({
  SessionStartView
}));

describe("Practice session page lifecycle routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes not-found decisions through the Next.js notFound boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "not-found"
    });

    await expect(
      PracticeSessionPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow("NOT_FOUND");
    expect(resolvePracticeRouteDecision).toHaveBeenCalledWith({
      intent: "practice-session",
      sessionId: defaultPracticeSessionId
    });
  });

  it("routes redirect decisions through the Next.js redirect boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "redirect",
      path: `/practice/${defaultPracticeSessionId}/report-generating`
    });

    await expect(
      PracticeSessionPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow(`REDIRECT:/practice/${defaultPracticeSessionId}/report-generating`);
  });

  it("renders the practice view for render decisions", async () => {
    const startedSession = {
      sessionId: defaultPracticeSessionId,
      openingContext: "Opening context",
      sessionSourceLabel: "Broad Practice Pool",
      lightPersonaLabel: "Finance operator"
    };
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "render-practice-session",
      startedSession
    });

    const result = await PracticeSessionPage({
      params: Promise.resolve({
        sessionId: defaultPracticeSessionId
      })
    });

    expect(result).toMatchObject({
      props: {
        startedSession
      }
    });
    expect((result as { type: unknown }).type).toBe(SessionStartView);
  });
});
