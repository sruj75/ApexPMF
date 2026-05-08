import { describe, expect, it, vi } from "vitest";
import { createHiddenEvaluationEngine } from "../src/domain/session/hidden-evaluation-engine";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";
import type { SessionTranscriptTurn } from "../src/domain/session/session-report";

describe("Hidden Evaluation engine", () => {
  it("returns ready from LLM judge JSON for ended non-quit sessions with >=5 turns", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi.fn(async () => ({
        id: "resp-1",
        model: "test-model",
        content: JSON.stringify(makeReadyJudgeOutput())
      }))
    };
    const engine = createHiddenEvaluationEngine({
      chatClient
    });

    const result = await engine.evaluateEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("natural-conclusion"),
      transcript: makeTranscript()
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready evaluation.");
    }
    expect(result.evaluation.trapResults[0]?.outcome).toBe("partial");
    expect(chatClient.createStructuredJsonCompletion).toHaveBeenCalledTimes(1);
  });

  it("returns typed insufficient reasons for user-quit, not-ended, short transcript, and missing speakers", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi.fn(async () => ({
        id: "resp-1",
        model: "test-model",
        content: JSON.stringify(makeReadyJudgeOutput())
      }))
    };
    const engine = createHiddenEvaluationEngine({
      chatClient
    });

    const userQuitCase = makeGeneratedSessionCase("user-quit");
    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: userQuitCase,
        transcript: makeTranscript()
      })
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "user-quit"
    });

    const notEndedCase = makeGeneratedSessionCase("natural-conclusion");
    notEndedCase.sessionLifecycle = {
      ...notEndedCase.sessionLifecycle,
      sessionStatus: "voice-conversation",
      endedReason: null,
      endedAt: null
    };
    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: notEndedCase,
        transcript: makeTranscript()
      })
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "not-ended"
    });

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("natural-conclusion"),
        transcript: makeTranscript().slice(0, 4)
      })
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "transcript-too-short"
    });

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("natural-conclusion"),
        transcript: makeLearnerOnlyTranscript()
      })
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "transcript-missing-speakers"
    });
  });

  it("retries once on invalid judge output and then returns invalid-judge-output when retry is still invalid", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi
        .fn()
        .mockResolvedValueOnce({
          id: "resp-1",
          model: "test-model",
          content: "{invalid-json"
        })
        .mockResolvedValueOnce({
          id: "resp-2",
          model: "test-model",
          content: JSON.stringify({
            status: "ready",
            reasonIfInsufficient: null,
            evaluation: null
          })
        })
    };
    const engine = createHiddenEvaluationEngine({
      chatClient
    });

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("natural-conclusion"),
        transcript: makeTranscript()
      })
    ).resolves.toEqual({
      status: "insufficient-evidence",
      reason: "invalid-judge-output"
    });

    expect(chatClient.createStructuredJsonCompletion).toHaveBeenCalledTimes(2);
  });

  it("returns provider-failure when judge call throws", async () => {
    const chatClient = {
      createStructuredJsonCompletion: vi.fn(async () => {
        throw new Error("provider unavailable");
      })
    };
    const engine = createHiddenEvaluationEngine({
      chatClient
    });

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("natural-conclusion"),
        transcript: makeTranscript()
      })
    ).resolves.toEqual({
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
    sessionTranscript: null,
    sessionEvaluation: null
  };
}

function makeTranscript(): SessionTranscriptTurn[] {
  return [
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
      text: "Sounds exciting and maybe useful.",
      metadata: { cue: "praise" }
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
      text: "We tried a consultant and manual spreadsheet workaround."
    },
    {
      sequence: 5,
      turnId: "turn-5",
      speaker: "learner",
      text: "Who decides this purchase and budget?"
    }
  ];
}

function makeLearnerOnlyTranscript(): SessionTranscriptTurn[] {
  return [
    {
      sequence: 1,
      speaker: "learner",
      text: "What did you try?"
    },
    {
      sequence: 2,
      speaker: "learner",
      text: "Who decides?"
    },
    {
      sequence: 3,
      speaker: "learner",
      text: "What workaround exists?"
    },
    {
      sequence: 4,
      speaker: "learner",
      text: "What was the budget?"
    },
    {
      sequence: 5,
      speaker: "learner",
      text: "How often does this happen?"
    }
  ];
}

function makeReadyJudgeOutput() {
  return {
    status: "ready",
    reasonIfInsufficient: null,
    evaluation: {
      interviewBehavior: {
        avoidingPitching: {
          outcome: "missed",
          note: "Pitch-first opener detected.",
          evidence: [
            {
              sequence: 1,
              turnId: "turn-1",
              snippet: "Would this be useful for your team?",
              title: "Speculative opener",
              detail: "Validation-seeking appeared early."
            }
          ]
        },
        askingConcreteHistory: {
          outcome: "met",
          note: "Concrete history question detected.",
          evidence: [
            {
              sequence: 3,
              turnId: "turn-3",
              snippet: "What did you try in the last month?",
              title: "Concrete history question",
              detail: "Asked for specific past attempts."
            }
          ]
        },
        followingUpOnVagueAnswers: {
          outcome: "met",
          note: "Vague answer followed with concrete probe.",
          evidence: [
            {
              sequence: 3,
              turnId: "turn-3",
              snippet: "What did you try in the last month?",
              title: "Follow-up",
              detail: "Converted social signal to discovery."
            }
          ]
        },
        resistingCompliments: {
          outcome: "met",
          note: "Compliment was not treated as proof.",
          evidence: [
            {
              sequence: 3,
              turnId: "turn-3",
              snippet: "What did you try in the last month?",
              title: "Compliment resistance",
              detail: "Asked behavior question after praise."
            }
          ]
        },
        identifyingBadFitPersonas: {
          outcome: "met",
          note: "Fit-discovery question detected.",
          evidence: [
            {
              sequence: 5,
              turnId: "turn-5",
              snippet: "Who decides this purchase and budget?",
              title: "Buyer/user fit probe",
              detail: "Question checked decision authority."
            }
          ]
        },
        uncoveringWorkaroundsOrDecisionProcess: {
          outcome: "met",
          note: "Decision process and workaround detail uncovered.",
          evidence: [
            {
              sequence: 5,
              turnId: "turn-5",
              snippet: "Who decides this purchase and budget?",
              title: "Decision process probe",
              detail: "Question targeted approval flow."
            }
          ]
        }
      },
      learningSignal: {
        quality: "high",
        summary: "Learner extracted useful customer truth.",
        evidence: [
          {
            sequence: 4,
            turnId: "turn-4",
            snippet: "We tried a consultant and manual spreadsheet workaround.",
            title: "Concrete workaround evidence",
            detail: "Persona described real past behavior."
          }
        ]
      },
      trapResults: [
        {
          trapId: "trap-1",
          trapLabel: "Compliment Trap",
          outcome: "partial",
          detail: "Early validation-seeking partially recovered with stronger follow-ups.",
          evidence: [
            {
              sequence: 1,
              turnId: "turn-1",
              snippet: "Would this be useful for your team?",
              title: "Trigger evidence",
              detail: "Validation-seeking opener."
            }
          ]
        }
      ],
      excludedDimensions: {
        accent: "not-scored",
        charisma: "not-scored",
        vocalPolish: "not-scored",
        soundingConfident: "not-scored"
      }
    }
  };
}
