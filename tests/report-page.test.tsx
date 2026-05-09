import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionReportPage from "../app/practice/[sessionId]/report/page";
import {
  defaultPracticeSessionId,
  makeReportPageSessionReport,
  makeReportPageTranscript
} from "./support/generated-session-case-fixture";

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

describe("Session report page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes not-found decisions through the Next.js notFound boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "not-found"
    });

    await expect(
      SessionReportPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow("NOT_FOUND");
    expect(resolvePracticeRouteDecision).toHaveBeenCalledWith({
      intent: "session-report",
      sessionId: defaultPracticeSessionId
    });
  });

  it("routes redirect decisions through the Next.js redirect boundary", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "redirect",
      path: `/practice/${defaultPracticeSessionId}/report-generating`
    });

    await expect(
      SessionReportPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    ).rejects.toThrow(`REDIRECT:/practice/${defaultPracticeSessionId}/report-generating`);
  });

  it("renders required report sections, source context, trap results, and inline transcript", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "render-session-report",
      report: makeReportPageSessionReport(),
      transcript: makeReportPageTranscript()
    });

    render(
      await SessionReportPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    );

    expect(screen.getByRole("heading", { name: /session report/i })).toBeVisible();
    expect(
      screen.getAllByText(/session ended with reason: natural-conclusion\./i).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/source context:/i)).toBeVisible();
    expect(screen.getByText(/broad practice pool/i)).toBeVisible();
    expect(screen.getByText(/persona label:/i)).toBeVisible();
    expect(screen.getByText(/finance operator/i)).toBeVisible();

    expect(screen.getByText(/compliment trap/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /session transcript/i })).toBeVisible();
    expect(screen.getByText(/what did you try recently\?/i)).toBeVisible();

    expect(
      screen.queryByText(/the operator rebuilt reports manually after a failed automation handoff/i)
    ).not.toBeInTheDocument();
  });

  it("supports expand and collapse for evidence snippets without transcript deep links", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "render-session-report",
      report: makeReportPageSessionReport(),
      transcript: makeReportPageTranscript()
    });

    render(
      await SessionReportPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    );

    const toggle = screen.getByRole("button", {
      name: /show evidence: asked concrete history follow-up/i
    });

    expect(screen.queryByText(/turn 1:/i)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText(/turn 1:/i)).toBeVisible();

    fireEvent.click(toggle);
    expect(screen.queryByText(/turn 1:/i)).not.toBeInTheDocument();

    const transcriptLinks = screen.queryAllByRole("link", {
      name: /turn 1|transcript/i
    });
    expect(transcriptLinks.length).toBe(0);
  });

  it("renders partial trap outcomes with an explicit Partial label", async () => {
    resolvePracticeRouteDecision.mockResolvedValue({
      action: "render-session-report",
      report: makeReportPageSessionReport("partial"),
      transcript: makeReportPageTranscript()
    });

    render(
      await SessionReportPage({
        params: Promise.resolve({
          sessionId: defaultPracticeSessionId
        })
      })
    );

    expect(
      screen.getByText(/partial: learner accepted praise then recovered with follow-up\./i)
    ).toBeVisible();
  });
});
