import { describe, expect, it } from "vitest";
import { createHiddenEvaluationEngine } from "../src/domain/session/hidden-evaluation-engine";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";
import type { SessionTranscriptTurn } from "../src/domain/session/session-report";

describe("Hidden Evaluation engine", () => {
  it("returns Mom-Test behavior evidence and excluded-dimension guards for ended non-quit sessions", async () => {
    const engine = createHiddenEvaluationEngine();

    const result = await engine.evaluateEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("bad-fit"),
      transcript: makeTranscript({
        learnerIntro:
          "Would this be useful for your team if we shipped automation quickly?",
        learnerFollowUp:
          "What did you try in the last month and who decides this purchase?",
        personaReply:
          "Sounds exciting. We currently stitch this in spreadsheets and a consultant review."
      })
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready evaluation artifact");
    }

    expect(result.evaluation.interviewBehavior.avoidingPitching.outcome).toBe(
      "missed"
    );
    expect(
      result.evaluation.interviewBehavior.askingConcreteHistory.outcome
    ).toBe("met");
    expect(
      result.evaluation.interviewBehavior.followingUpOnVagueAnswers.outcome
    ).toBe("met");
    expect(
      result.evaluation.interviewBehavior.resistingCompliments.outcome
    ).toBe("met");
    expect(
      result.evaluation.interviewBehavior.identifyingBadFitPersonas.outcome
    ).toBe("met");
    expect(
      result.evaluation.interviewBehavior.uncoveringWorkaroundsOrDecisionProcess
        .outcome
    ).toBe("met");

    expect(result.evaluation.learningSignal.quality).toBe("high");
    expect(result.evaluation.excludedDimensions).toEqual({
      accent: "not-scored",
      charisma: "not-scored",
      vocalPolish: "not-scored",
      soundingConfident: "not-scored"
    });
    expect(result.evaluation.interviewBehavior.askingConcreteHistory.evidence[0])
      .toMatchObject({
        sequence: 3
      });
  });

  it("maps trap outcomes deterministically to triggered, avoided, and partial", async () => {
    const engine = createHiddenEvaluationEngine();

    const partial = await engine.evaluateEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("strong-fit"),
      transcript: makeTranscript({
        learnerIntro: "This will totally fix your reporting stack fast.",
        learnerFollowUp: "What did you try before and what still broke?",
        personaReply:
          "Nice idea. We paid a consultant and still manually rebuilt at close."
      })
    });
    expect(partial.status).toBe("ready");
    if (partial.status !== "ready") {
      throw new Error("Expected ready partial trap result.");
    }
    expect(partial.evaluation.trapResults[0]?.outcome).toBe("partial");

    const triggered = await engine.evaluateEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("strong-fit"),
      transcript: makeTranscript({
        learnerIntro: "Would this be useful for your team?",
        learnerFollowUp: "Amazing, should we book a demo then?",
        personaReply: "This sounds great and very exciting."
      })
    });
    expect(triggered.status).toBe("ready");
    if (triggered.status !== "ready") {
      throw new Error("Expected ready triggered trap result.");
    }
    expect(triggered.evaluation.trapResults[0]?.outcome).toBe("triggered");

    const avoided = await engine.evaluateEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("strong-fit"),
      transcript: makeTranscript({
        learnerIntro: "Can you walk me through the last time this happened?",
        learnerFollowUp:
          "Who approved that workaround and what did it cost in time?",
        personaReply:
          "We rebuilt in spreadsheets and the finance director approved overtime."
      })
    });
    expect(avoided.status).toBe("ready");
    if (avoided.status !== "ready") {
      throw new Error("Expected ready avoided trap result.");
    }
    expect(avoided.evaluation.trapResults[0]?.outcome).toBe("avoided");
  });

  it("returns insufficient-evidence for user-quit or missing transcript evidence", async () => {
    const engine = createHiddenEvaluationEngine();
    const generatedSessionCase = makeGeneratedSessionCase("strong-fit");
    generatedSessionCase.sessionLifecycle = {
      ...generatedSessionCase.sessionLifecycle,
      endedReason: "user-quit"
    };

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase,
        transcript: makeTranscript({
          learnerIntro: "Would this help?",
          learnerFollowUp: "Can we schedule a demo?",
          personaReply: "Sure, maybe."
        })
      })
    ).resolves.toEqual({
      status: "insufficient-evidence"
    });

    await expect(
      engine.evaluateEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("strong-fit"),
        transcript: []
      })
    ).resolves.toEqual({
      status: "insufficient-evidence"
    });
  });
});

function makeGeneratedSessionCase(
  fit: GeneratedSessionCase["customerFit"]
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
    hiddenBackstory:
      "The operator rebuilt reports manually after a failed automation handoff.",
    customerFit: fit,
    hiddenTestPlan: {
      focusAreas: ["Concrete History"],
      successSignals: ["Asked about recent attempts"],
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
      endedReason: "natural-conclusion",
      endedAt: new Date("2026-05-08T09:00:00.000Z"),
      reportStatus: "generating",
      reportReadyAt: null
    },
    sessionReport: null,
    sessionTranscript: null,
    sessionEvaluation: null
  };
}

function makeTranscript(input: {
  learnerIntro: string;
  personaReply: string;
  learnerFollowUp: string;
}): SessionTranscriptTurn[] {
  return [
    {
      sequence: 1,
      turnId: "turn-1",
      speaker: "learner",
      text: input.learnerIntro
    },
    {
      sequence: 2,
      turnId: "turn-2",
      speaker: "persona",
      text: input.personaReply,
      metadata: {
        cue: "praise"
      }
    },
    {
      sequence: 3,
      turnId: "turn-3",
      speaker: "learner",
      text: input.learnerFollowUp
    }
  ];
}
