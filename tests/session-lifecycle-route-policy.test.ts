import { describe, expect, it } from "vitest";
import {
  resolveReportGeneratingDecision,
  resolveSessionLifecycleRoute,
  type ReportGeneratingDecision,
  type SessionLifecycleDestination
} from "../src/application/end-session/session-lifecycle-route-policy";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";
import {
  makeGeneratedSessionCase,
  makeSessionEvaluation,
  makeSessionReport
} from "./support/generated-session-case-fixture";

describe("Session lifecycle route policy", () => {
  it("routes Voice Conversation snapshots back to practice session", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-voice",
        sessionLifecycle: {
          sessionStatus: "voice-conversation"
        }
      }),
      {
        destination: "voice-conversation",
        nextPath: "/practice/session-voice"
      }
    );
  });

  it("routes ended user-quit snapshots to dashboard", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-user-quit",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "user-quit"
        }
      }),
      {
        destination: "practice-dashboard",
        nextPath: "/dashboard"
      }
    );
  });

  it("routes insufficient-evidence snapshots to dashboard", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-insufficient",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "insufficient-evidence"
        }
      }),
      {
        destination: "practice-dashboard",
        nextPath: "/dashboard"
      }
    );
  });

  it("routes not-requested snapshots to dashboard", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-not-requested",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "not-requested"
        }
      }),
      {
        destination: "practice-dashboard",
        nextPath: "/dashboard"
      }
    );
  });

  it("routes generating snapshots to report-generating", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-generating",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "generating"
        }
      }),
      {
        destination: "report-generating",
        nextPath: "/practice/session-generating/report-generating"
      }
    );
  });

  it("routes ready snapshots with complete report artifacts to Session Report", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-ready",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "ready"
        },
        sessionReport: makeSessionReport(),
        sessionTranscript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          }
        ],
        sessionEvaluation: makeSessionEvaluation()
      }),
      {
        destination: "session-report",
        nextPath: "/practice/session-ready/report"
      }
    );
  });

  it("routes ready snapshots with missing artifacts to report-generating", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-ready-missing-evaluation",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "ready"
        },
        sessionReport: makeSessionReport(),
        sessionTranscript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          }
        ],
        sessionEvaluation: null
      }),
      {
        destination: "report-generating",
        nextPath: "/practice/session-ready-missing-evaluation/report-generating"
      }
    );
  });

  it("routes ready snapshots with missing report artifacts to report-generating", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-ready-missing-report",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "ready"
        },
        sessionReport: null,
        sessionTranscript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          }
        ],
        sessionEvaluation: makeSessionEvaluation()
      }),
      {
        destination: "report-generating",
        nextPath: "/practice/session-ready-missing-report/report-generating"
      }
    );
  });

  it("routes ready snapshots with missing transcript artifacts to report-generating", () => {
    expectRoute(
      makeGeneratedSessionCase({
        id: "session-ready-missing-transcript",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "ready"
        },
        sessionReport: makeSessionReport(),
        sessionTranscript: null,
        sessionEvaluation: makeSessionEvaluation()
      }),
      {
        destination: "report-generating",
        nextPath: "/practice/session-ready-missing-transcript/report-generating"
      }
    );
  });

  it("marks report-generating snapshots as generate-report decisions", () => {
    expectReportGeneratingDecision(
      makeGeneratedSessionCase({
        id: "session-generate-decision",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "generating"
        }
      }),
      {
        decision: "generate-report",
        nextPath: "/practice/session-generate-decision/report-generating"
      }
    );
  });

  it("skips generation and routes ready snapshots with complete artifacts to Session Report", () => {
    expectReportGeneratingDecision(
      makeGeneratedSessionCase({
        id: "session-skip-ready",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "natural-conclusion",
          reportStatus: "ready"
        },
        sessionReport: makeSessionReport(),
        sessionTranscript: [
          {
            sequence: 1,
            speaker: "learner",
            text: "What did you try recently?"
          }
        ],
        sessionEvaluation: makeSessionEvaluation()
      }),
      {
        decision: "skip-generation",
        reportStatus: "ready",
        nextPath: "/practice/session-skip-ready/report"
      }
    );
  });

  it("skips generation and preserves destination path when report generation is not applicable", () => {
    expectReportGeneratingDecision(
      makeGeneratedSessionCase({
        id: "session-skip-user-quit",
        sessionLifecycle: {
          sessionStatus: "ended",
          endedReason: "user-quit"
        }
      }),
      {
        decision: "skip-generation",
        reportStatus: "insufficient-evidence",
        nextPath: "/dashboard"
      }
    );

    expectReportGeneratingDecision(
      makeGeneratedSessionCase({
        id: "session-skip-voice",
        sessionLifecycle: {
          sessionStatus: "voice-conversation"
        }
      }),
      {
        decision: "skip-generation",
        reportStatus: "insufficient-evidence",
        nextPath: "/practice/session-skip-voice"
      }
    );
  });
});

function expectRoute(
  generatedSessionCase: GeneratedSessionCase,
  expected: SessionLifecycleDestination
) {
  expect(
    resolveSessionLifecycleRoute({
      sessionId: generatedSessionCase.id,
      generatedSessionCase
    })
  ).toEqual(expected);
}

function expectReportGeneratingDecision(
  generatedSessionCase: GeneratedSessionCase,
  expected: ReportGeneratingDecision
) {
  expect(
    resolveReportGeneratingDecision({
      sessionId: generatedSessionCase.id,
      generatedSessionCase
    })
  ).toEqual(expected);
}
