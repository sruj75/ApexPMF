import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import {
  resolvePracticeRouteDecision,
  type PracticeRouteDecisionDependencies
} from "../src/application/practice-route/practice-route-decision";
import {
  defaultPracticeSessionId,
  makeGeneratedSessionCase,
  makeSessionEvaluation,
  makeSessionReport
} from "./support/generated-session-case-fixture";

describe("Practice route decision module", () => {
  it("returns not-found for invalid Session ids across all route intents", async () => {
    const deps = makeDependencies();

    await expectDecision({ intent: "practice-session", sessionId: "bad-id" }, deps, {
      action: "not-found"
    });
    await expectDecision({ intent: "session-report", sessionId: "bad-id" }, deps, {
      action: "not-found"
    });
    await expectDecision({ intent: "report-generating", sessionId: "bad-id" }, deps, {
      action: "not-found"
    });
  });

  it("returns login redirect when practice/session-report entry context is unauthenticated", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );

    await expectDecision(
      {
        intent: "practice-session",
        sessionId: defaultPracticeSessionId
      },
      deps,
      { action: "redirect", path: "/login" }
    );
  });

  it("returns not-found when generated session does not exist for learner", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() => Effect.succeed(null))
        }
      })
    );

    await expectDecision(
      {
        intent: "session-report",
        sessionId: defaultPracticeSessionId
      },
      deps,
      { action: "not-found" }
    );
  });

  it("redirects practice-session intent when lifecycle route is report-generating", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "natural-conclusion",
                  reportStatus: "generating"
                }
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "practice-session",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: `/practice/${defaultPracticeSessionId}/report-generating`
      }
    );
  });

  it("redirects practice-session intent when lifecycle route is session-report", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "natural-conclusion",
                  reportStatus: "ready"
                },
                sessionReport: makeSessionReport(),
                sessionTranscript: [{ sequence: 1, speaker: "learner", text: "What changed?" }],
                sessionEvaluation: makeSessionEvaluation()
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "practice-session",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: `/practice/${defaultPracticeSessionId}/report`
      }
    );
  });

  it("returns a practice render decision when lifecycle route stays on voice conversation", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "voice-conversation"
                }
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "practice-session",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "render-practice-session",
        startedSession: {
          sessionId: defaultPracticeSessionId,
          openingContext: "Opening context",
          sessionSourceLabel: "Broad Practice Pool",
          lightPersonaLabel: "Finance operator",
          creditContext: { kind: "free-trial" }
        }
      }
    );
  });

  it("redirects session-report intent when lifecycle route is still report-generating", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "credit-exhaustion",
                  reportStatus: "generating"
                }
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "session-report",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: `/practice/${defaultPracticeSessionId}/report-generating`
      }
    );
  });

  it("redirects session-report intent to dashboard when lifecycle route is practice-dashboard", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "user-quit",
                  reportStatus: "insufficient-evidence"
                }
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "session-report",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: "/dashboard"
      }
    );
  });

  it("redirects session-report intent to report-generating when ready artifacts are incomplete", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "natural-conclusion",
                  reportStatus: "ready"
                },
                sessionReport: makeSessionReport(),
                sessionTranscript: null,
                sessionEvaluation: makeSessionEvaluation()
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "session-report",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: `/practice/${defaultPracticeSessionId}/report-generating`
      }
    );
  });

  it("returns report render decision when session report artifacts are routable", async () => {
    const deps = makeDependencies();
    deps.getLearnerEntryContext.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: {
                  sessionStatus: "ended",
                  endedReason: "natural-conclusion",
                  reportStatus: "ready"
                },
                sessionReport: makeSessionReport(),
                sessionTranscript: [{ sequence: 1, speaker: "learner", text: "What changed?" }],
                sessionEvaluation: makeSessionEvaluation()
              })
            )
          )
        }
      })
    );

    await expectDecision(
      {
        intent: "session-report",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "render-session-report",
        report: makeSessionReport(),
        transcript: [{ sequence: 1, speaker: "learner", text: "What changed?" }]
      }
    );
  });

  it("returns login redirect when report-generating runtime is unauthenticated", async () => {
    const deps = makeDependencies();
    deps.getLearnerSessionRuntime.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );

    await expectDecision(
      {
        intent: "report-generating",
        sessionId: defaultPracticeSessionId
      },
      deps,
      { action: "redirect", path: "/login" }
    );
  });

  it("returns report-generating redirect from learner runtime flow outcome", async () => {
    const deps = makeDependencies();
    const runReportGeneratingFlowForLearner = vi.fn(() =>
      Effect.succeed({
        reportStatus: "ready" as const,
        nextPath: `/practice/${defaultPracticeSessionId}/report`
      })
    );
    deps.getLearnerSessionRuntime.mockReturnValue(
      Effect.succeed({
        ok: true,
        runReportGeneratingFlowForLearner
      })
    );

    await expectDecision(
      {
        intent: "report-generating",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: `/practice/${defaultPracticeSessionId}/report`
      }
    );
    expect(runReportGeneratingFlowForLearner).toHaveBeenCalledWith({
      sessionId: defaultPracticeSessionId
    });
  });

  it("returns dashboard redirect when report-generating flow outcome is insufficient-evidence", async () => {
    const deps = makeDependencies();
    deps.getLearnerSessionRuntime.mockReturnValue(
      Effect.succeed({
        ok: true,
        runReportGeneratingFlowForLearner: vi.fn(() =>
          Effect.succeed({
            reportStatus: "insufficient-evidence",
            nextPath: "/dashboard"
          })
        )
      })
    );

    await expectDecision(
      {
        intent: "report-generating",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "redirect",
        path: "/dashboard"
      }
    );
  });

  it("returns not-found when report-generating runtime flow resolves missing Session", async () => {
    const deps = makeDependencies();
    deps.getLearnerSessionRuntime.mockReturnValue(
      Effect.succeed({
        ok: true,
        runReportGeneratingFlowForLearner: vi.fn(() =>
          Effect.succeed({
            reportStatus: "not-found" as const
          })
        )
      })
    );

    await expectDecision(
      {
        intent: "report-generating",
        sessionId: defaultPracticeSessionId
      },
      deps,
      {
        action: "not-found"
      }
    );
  });
});

async function expectDecision(
  input: Parameters<typeof resolvePracticeRouteDecision>[0],
  dependencies: PracticeRouteDecisionDependencies,
  expected: Awaited<ReturnType<typeof resolvePracticeRouteDecision>>
) {
  await expect(resolvePracticeRouteDecision(input, dependencies)).resolves.toEqual(expected);
}

function makeDependencies(): PracticeRouteDecisionDependencies {
  return {
    getLearnerEntryContext: vi.fn(() =>
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: {} as never,
        generatedSessionCaseRepository: {
          getForLearner: vi.fn(() =>
            Effect.succeed(
              makeGeneratedSessionCase({
                id: defaultPracticeSessionId,
                sessionLifecycle: { sessionStatus: "voice-conversation" }
              })
            )
          )
        }
      })
    ),
    getLearnerSessionRuntime: vi.fn(() =>
      Effect.succeed({
        ok: true,
        runReportGeneratingFlowForLearner: vi.fn(() =>
          Effect.succeed({
            reportStatus: "ready" as const,
            nextPath: `/practice/${defaultPracticeSessionId}/report`
          })
        )
      })
    )
  };
}
