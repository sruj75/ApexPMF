import { afterAll, describe, expect, it, vi } from "vitest";
import { createReportGenerationCoordinator } from "../src/application/generate-report/report-generation-coordinator";
import type { NonLiveLlmRuntimePolicy } from "../src/application/non-live-llm-policy";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";
import { Effect } from "effect";

const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY;

describe("Report generation coordinator", () => {
  afterAll(() => {
    process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey;
  });

  it("uses real transcript and returns ready artifacts when judge and report builder succeed", async () => {
    const hiddenEvaluationEngine = {
      evaluateEndedSession: vi.fn(() =>
        Effect.succeed({
          status: "ready" as const,
          evaluation: makeEvaluation()
        })
      )
    };
    const reportBuilder = {
      buildFromEvaluation: vi.fn(() =>
        Effect.succeed({
          status: "ready" as const,
          report: makeReport()
        })
      )
    };

    const coordinator = createReportGenerationCoordinator({
      hiddenEvaluationEngine,
      reportBuilder
    });

    const generatedSessionCase = makeGeneratedSessionCase("natural-conclusion");
    const result = await Effect.runPromise(
      coordinator.generateForEndedSession({
        generatedSessionCase
      })
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready report generation result.");
    }

    expect(result.transcript).toEqual(generatedSessionCase.sessionTranscript);
    expect(result.evaluation.learningSignal.quality).toBe("medium");
    expect(hiddenEvaluationEngine.evaluateEndedSession).toHaveBeenCalledTimes(1);
    expect(reportBuilder.buildFromEvaluation).toHaveBeenCalledTimes(1);
  });

  it("returns insufficient-evidence when transcript is missing or too short", async () => {
    const coordinator = createReportGenerationCoordinator({
      hiddenEvaluationEngine: {
        evaluateEndedSession: vi.fn(() =>
          Effect.succeed({
            status: "ready" as const,
            evaluation: makeEvaluation()
          })
        )
      },
      reportBuilder: {
        buildFromEvaluation: vi.fn(() =>
          Effect.succeed({
            status: "ready" as const,
            report: makeReport()
          })
        )
      }
    });

    await expect(
      Effect.runPromise(
        coordinator.generateForEndedSession({
          generatedSessionCase: {
            ...makeGeneratedSessionCase("natural-conclusion"),
            sessionTranscript: null
          }
        })
      )
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "transcript-too-short"
    });
  });

  it("passes through typed insufficient reason from hidden evaluation", async () => {
    const coordinator = createReportGenerationCoordinator({
      hiddenEvaluationEngine: {
        evaluateEndedSession: vi.fn(() =>
          Effect.succeed({
            status: "insufficient-evidence" as const,
            reason: "invalid-judge-output" as const
          })
        )
      },
      reportBuilder: {
        buildFromEvaluation: vi.fn(() =>
          Effect.succeed({
            status: "ready" as const,
            report: makeReport()
          })
        )
      }
    });

    await expect(
      Effect.runPromise(
        coordinator.generateForEndedSession({
          generatedSessionCase: makeGeneratedSessionCase("natural-conclusion")
        })
      )
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "invalid-judge-output"
    });
  });

  it("passes through provider-failure reason from hidden evaluation", async () => {
    const coordinator = createReportGenerationCoordinator({
      hiddenEvaluationEngine: {
        evaluateEndedSession: vi.fn(() =>
          Effect.succeed({
            status: "insufficient-evidence" as const,
            reason: "provider-failure" as const
          })
        )
      },
      reportBuilder: {
        buildFromEvaluation: vi.fn(() =>
          Effect.succeed({
            status: "ready" as const,
            report: makeReport()
          })
        )
      }
    });

    await expect(
      Effect.runPromise(
        coordinator.generateForEndedSession({
          generatedSessionCase: makeGeneratedSessionCase("natural-conclusion")
        })
      )
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "provider-failure"
    });
  });

  it("uses provider-failure fallback engine when OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const coordinator = createReportGenerationCoordinator();

    await expect(
      Effect.runPromise(
        coordinator.generateForEndedSession({
          generatedSessionCase: makeGeneratedSessionCase("natural-conclusion")
        })
      )
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "provider-failure"
    });
  });

  it("uses injected non-live runtime policy to compose hidden evaluation engine", async () => {
    const evaluateEndedSession = vi.fn(() =>
      Effect.succeed({
        status: "insufficient-evidence" as const,
        reason: "provider-failure" as const
      })
    );
    const nonLiveLlmRuntimePolicy: NonLiveLlmRuntimePolicy = {
      composePersonaGenerator: () =>
        Effect.succeed({
          generateSessionCase: () =>
            Effect.succeed(makeGeneratedSessionCase("natural-conclusion"))
        }),
      composeHiddenEvaluationEngine: () => ({
        evaluateEndedSession
      }),
      mapStartSessionFailure: (cause) => {
        throw cause;
      }
    };
    const coordinator = createReportGenerationCoordinator({
      nonLiveLlmRuntimePolicy
    });

    const result = await Effect.runPromise(
      coordinator.generateForEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("natural-conclusion")
      })
    );

    expect(evaluateEndedSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: "insufficient-evidence",
      reason: "provider-failure"
    });
  });
});

function makeGeneratedSessionCase(
  endedReason: NonNullable<GeneratedSessionCase["sessionLifecycle"]["endedReason"]>
): GeneratedSessionCase {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    learnerId: "learner-1",
    sessionSource: {
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    },
    openingContext: "Opening context",
    customerPersona: {
      lightPersonaLabel: "Finance operator",
      interviewRole: "Controller",
      publicContext: "Owns reporting",
      privateConstraints: ["Budget owner is VP Finance"]
    },
    hiddenBackstory: "Hidden backstory",
    customerFit: "bad-fit",
    hiddenTestPlan: {
      focusAreas: ["Concrete History"],
      successSignals: ["Asked about recent attempts"],
      failureSignals: ["Accepted vague praise"]
    },
    personaBehavior: {
      conversationalFriction: [
        "hesitation",
        "rambling",
        "vague-answers",
        "mild-discomfort",
        "interruption",
        "questions-back"
      ],
      weakQuestionSocialSignals: [
        "politeness",
        "praise",
        "speculation",
        "vague-interest"
      ],
      strongQuestionTruthAnchors: [
        "paid-consultant-attempt",
        "manual-rebuild-weekend"
      ],
      trapDelivery: "natural-hidden"
    },
    traps: [
      {
        id: "trap-1",
        label: "Compliment Trap",
        setup: "Persona praises the pitch.",
        weakBehavior: "Learner accepts praise as validation."
      }
    ],
    generationNonce: "nonce-1",
    generationAudit: {
      provider: "test",
      model: "test-model"
    },
    createdAt: new Date("2026-05-08T08:00:00.000Z"),
    sessionLifecycle: {
      sessionStatus: "ended",
      endedReason,
      endedAt: new Date("2026-05-08T09:00:00.000Z"),
      reportStatus: "generating",
      reportReadyAt: null
    },
    sessionReport: null,
    sessionTranscript: [
      {
        sequence: 1,
        turnId: "turn-1",
        speaker: "learner",
        text: "Would this be useful for your team?"
      },
      {
        sequence: 2,
        turnId: "turn-2",
        speaker: "persona",
        text: "Sounds exciting and maybe useful."
      },
      {
        sequence: 3,
        turnId: "turn-3",
        speaker: "learner",
        text: "What did you try in the last month?"
      },
      {
        sequence: 4,
        turnId: "turn-4",
        speaker: "persona",
        text: "We tried manual workarounds."
      },
      {
        sequence: 5,
        turnId: "turn-5",
        speaker: "learner",
        text: "Who decides and approves budget?"
      }
    ],
    sessionEvaluation: null
  };
}

function makeEvaluation() {
  return {
    interviewBehavior: {
      avoidingPitching: {
        outcome: "missed" as const,
        note: "Pitch-first opener detected.",
        evidence: [
          {
            sequence: 1,
            turnId: "turn-1",
            snippet: "Would this be useful for your team?",
            title: "Speculative opener",
            detail: "Validation-seeking early."
          }
        ]
      },
      askingConcreteHistory: {
        outcome: "met" as const,
        note: "Concrete history prompt detected.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Concrete history",
            detail: "Asked for prior attempt."
          }
        ]
      },
      followingUpOnVagueAnswers: {
        outcome: "met" as const,
        note: "Follow-up detected.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Follow-up",
            detail: "Follow-up after social signal."
          }
        ]
      },
      resistingCompliments: {
        outcome: "met" as const,
        note: "Compliment resisted.",
        evidence: [
          {
            sequence: 3,
            turnId: "turn-3",
            snippet: "What did you try in the last month?",
            title: "Compliment resistance",
            detail: "Kept interview grounded."
          }
        ]
      },
      identifyingBadFitPersonas: {
        outcome: "partial" as const,
        note: "Fit signal partial.",
        evidence: []
      },
      uncoveringWorkaroundsOrDecisionProcess: {
        outcome: "met" as const,
        note: "Decision process uncovered.",
        evidence: [
          {
            sequence: 5,
            turnId: "turn-5",
            snippet: "Who decides and approves budget?",
            title: "Decision probe",
            detail: "Asked who approves."
          }
        ]
      }
    },
    learningSignal: {
      quality: "medium" as const,
      summary: "Useful customer discovery evidence appeared.",
      evidence: [
        {
          sequence: 4,
          turnId: "turn-4",
          snippet: "We tried manual workarounds.",
          title: "Workaround evidence",
          detail: "Concrete workaround surfaced."
        }
      ]
    },
    trapResults: [
      {
        trapId: "trap-1",
        trapLabel: "Compliment Trap",
        outcome: "partial" as const,
        detail: "Partial recovery after social-validation cue.",
        evidence: [
          {
            sequence: 1,
            turnId: "turn-1",
            snippet: "Would this be useful for your team?",
            title: "Trigger evidence",
            detail: "Speculative opener."
          }
        ]
      }
    ],
    excludedDimensions: {
      accent: "not-scored" as const,
      charisma: "not-scored" as const,
      vocalPolish: "not-scored" as const,
      soundingConfident: "not-scored" as const
    }
  };
}

function makeReport() {
  return {
    outcome: {
      summary: "Session ended with reason: natural-conclusion."
    },
    missedSignals: [],
    badQuestions: [],
    strongQuestions: [],
    trapResults: [],
    skillMovement: [],
    nextPracticeFocus: {
      title: "Ask behavior-first follow-ups",
      description: "After social signals, ask past behavior questions."
    },
    sourceContext: "Broad Practice Pool",
    lightPersonaLabel: "Finance operator",
    expandableEvidence: []
  };
}
