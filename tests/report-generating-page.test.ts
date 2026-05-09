import { beforeEach, describe, expect, it, vi } from "vitest";
import ReportGeneratingPage from "../app/practice/[sessionId]/report-generating/page";
import { defaultPracticeSessionId } from "./support/generated-session-case-fixture";

const { redirect, notFound, resolvePracticeRouteDecision } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  resolvePracticeRouteDecision: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound
}));

vi.mock("@/src/application/practice-route/practice-route-decision", () => ({
  resolvePracticeRouteDecision
}));

describe("Report generating page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes not-found decisions through the Next.js notFound boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "not-found"
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow("NOT_FOUND");
    expect(resolvePracticeRouteDecision).toHaveBeenCalledWith({
      intent: "report-generating",
      sessionId: defaultPracticeSessionId
    });
  });

  it("routes redirect decisions through the Next.js redirect boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "redirect",
      path: `/practice/${defaultPracticeSessionId}/report`
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow(`REDIRECT:/practice/${defaultPracticeSessionId}/report`);
  });

  it("treats non-redirect render decisions as not-found for defensive routing", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "render-practice-session",
      startedSession: {
        sessionId: defaultPracticeSessionId,
        openingContext: "Opening context",
        sessionSourceLabel: "Broad Practice Pool",
        lightPersonaLabel: "Finance operator"
      }
    });

    await expect(
      ReportGeneratingPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow("NOT_FOUND");
  });
});
