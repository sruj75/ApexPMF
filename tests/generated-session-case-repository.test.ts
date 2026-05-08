import { describe, expect, it } from "vitest";
import { createInMemoryGeneratedSessionCaseRepository } from "../src/domain/session/generated-session-case-repository";

describe("Generated Session Case repository", () => {
  it("continues ID sequencing from the highest existing session-case ID", async () => {
    const repository = createInMemoryGeneratedSessionCaseRepository([
      {
        id: "session-case-100",
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
        customerFit: "strong-fit",
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
        generationNonce: "nonce-100",
        generationAudit: {
          provider: "test",
          model: "test-model"
        },
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
        sessionLifecycle: {
          sessionStatus: "voice-conversation",
          endedReason: null,
          endedAt: null,
          reportStatus: "not-requested",
          reportReadyAt: null
        },
        sessionReport: null,
        sessionTranscript: null,
        sessionEvaluation: null
      }
    ]);

    const created = await repository.create("learner-1", {
      sessionSource: {
        kind: "broad-practice-pool",
        label: "Broad Practice Pool"
      },
      openingContext: "New opening context",
      customerPersona: {
        lightPersonaLabel: "Clinical operator",
        interviewRole: "Practice manager",
        publicContext: "Owns clinic scheduling",
        privateConstraints: ["Budget owner is founder"]
      },
      hiddenBackstory: "New hidden backstory",
      customerFit: "weak-fit",
      hiddenTestPlan: {
        focusAreas: ["Concrete History"],
        successSignals: ["Asked about current workaround"],
        failureSignals: ["Pitched before diagnosis"]
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
          id: "trap-2",
          label: "Polite Interest Trap",
          setup: "Persona sounds interested.",
          weakBehavior: "Learner treats it as intent."
        }
      ],
      generationNonce: "nonce-101",
      generationAudit: {
        provider: "test",
        model: "test-model"
      }
    });

    expect(created.id).toBe("session-case-101");
    expect(created.personaBehavior.trapDelivery).toBe("natural-hidden");
    expect(created.sessionLifecycle).toEqual({
      sessionStatus: "voice-conversation",
      endedReason: null,
      endedAt: null,
      reportStatus: "not-requested",
      reportReadyAt: null
    });
  });

  it("updates persisted session lifecycle state for the matching Learner and Session", async () => {
    const repository = createInMemoryGeneratedSessionCaseRepository();
    const created = await repository.create("learner-1", {
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
      customerFit: "strong-fit",
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
      }
    });

    const updated = await repository.updateSessionLifecycleForLearner({
      learnerId: "learner-1",
      sessionCaseId: created.id,
      updater: (current) => ({
        ...current,
        sessionStatus: "ended",
        endedReason: "60-minute cap",
        endedAt: new Date("2026-05-08T08:00:00.000Z"),
        reportStatus: "generating",
        reportReadyAt: null
      })
    });

    expect(updated?.sessionLifecycle).toMatchObject({
      sessionStatus: "ended",
      endedReason: "60-minute cap",
      reportStatus: "generating"
    });
  });

  it("persists report artifacts with report lifecycle state in one update call", async () => {
    const repository = createInMemoryGeneratedSessionCaseRepository();
    const created = await repository.create("learner-1", {
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
      customerFit: "strong-fit",
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
      generationNonce: "nonce-2",
      generationAudit: {
        provider: "test",
        model: "test-model"
      }
    });

    const updated = await repository.updateReportArtifactsForLearner({
      learnerId: "learner-1",
      sessionCaseId: created.id,
      reportStatus: "ready",
      reportReadyAt: new Date("2026-05-08T11:00:00.000Z"),
      sessionReport: {
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
          description:
            "After social signals, ask about past behavior before solutions."
        },
        sourceContext: "Broad Practice Pool",
        lightPersonaLabel: "Finance operator",
        expandableEvidence: []
      },
      sessionTranscript: [
        {
          sequence: 1,
          speaker: "learner",
          text: "What did you try recently?"
        }
      ],
      sessionEvaluation: {
        interviewBehavior: {
          avoidingPitching: {
            outcome: "missed",
            note: "Pitch-first opener detected.",
            evidence: []
          },
          askingConcreteHistory: {
            outcome: "met",
            note: "Concrete history question detected.",
            evidence: []
          },
          followingUpOnVagueAnswers: {
            outcome: "met",
            note: "Vague answer followed by concrete question.",
            evidence: []
          },
          resistingCompliments: {
            outcome: "met",
            note: "Praise was resisted.",
            evidence: []
          },
          identifyingBadFitPersonas: {
            outcome: "partial",
            note: "Not central in this fit context.",
            evidence: []
          },
          uncoveringWorkaroundsOrDecisionProcess: {
            outcome: "met",
            note: "Workaround prompt detected.",
            evidence: []
          }
        },
        learningSignal: {
          quality: "medium",
          summary: "Useful discovery evidence appeared.",
          evidence: []
        },
        trapResults: [
          {
            trapId: "trap-1",
            trapLabel: "Compliment Trap",
            outcome: "partial",
            detail: "Learner partially recovered from praise bait.",
            evidence: []
          }
        ],
        excludedDimensions: {
          accent: "not-scored",
          charisma: "not-scored",
          vocalPolish: "not-scored",
          soundingConfident: "not-scored"
        }
      }
    });

    expect(updated?.sessionLifecycle).toMatchObject({
      reportStatus: "ready"
    });
    expect(updated?.sessionReport?.outcome.summary).toBe(
      "Session ended with reason: natural-conclusion."
    );
    expect(updated?.sessionTranscript).toEqual([
      {
        sequence: 1,
        speaker: "learner",
        text: "What did you try recently?"
      }
    ]);
    expect(updated?.sessionEvaluation?.trapResults[0]?.outcome).toBe("partial");
  });
});
