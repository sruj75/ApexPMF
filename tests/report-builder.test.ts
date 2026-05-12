import { describe, expect, it } from "vitest";
import { createDeterministicReportBuilder } from "../src/domain/session/report-builder";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";
import type { SessionEvaluationArtifact } from "../src/domain/session/session-evaluation";
import type { SessionTranscriptTurn } from "../src/domain/session/session-report";
import { Effect } from "effect";

describe("Report Builder", () => {
  it("returns a structured report using persisted evaluation evidence", async () => {
    const reportBuilder = createDeterministicReportBuilder();

    const result = await Effect.runPromise(
      reportBuilder.buildFromEvaluation({
        generatedSessionCase: makeGeneratedSessionCase(),
        transcript: makeTranscript(),
        evaluation: makeEvaluation("partial")
      })
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready report output.");
    }

    expect(result.report.outcome.summary).toMatch(/ended with reason/i);
    expect(result.report.missedSignals.length).toBeGreaterThan(0);
    expect(result.report.badQuestions.length).toBeGreaterThan(0);
    expect(result.report.strongQuestions.length).toBeGreaterThan(0);
    expect(result.report.trapResults[0]?.outcome).toBe("partial");
    expect(result.report.skillMovement.length).toBeGreaterThan(0);
    expect(result.report.nextPracticeFocus.title.length).toBeGreaterThan(0);
    expect(result.report.sourceContext.length).toBeGreaterThan(0);
    expect(result.report.lightPersonaLabel).toBe("Finance operator");
    expect(result.report.expandableEvidence.length).toBeGreaterThan(0);
  });

  it("returns insufficient-evidence when learning-signal evidence is empty", async () => {
    const reportBuilder = createDeterministicReportBuilder();
    const evaluation = makeEvaluation("avoided");
    evaluation.learningSignal.evidence = [];

    const result = await Effect.runPromise(
      reportBuilder.buildFromEvaluation({
        generatedSessionCase: makeGeneratedSessionCase(),
        transcript: makeTranscript(),
        evaluation
      })
    );

    expect(result).toEqual({
      status: "insufficient-evidence"
    });
  });
});

function makeGeneratedSessionCase(): GeneratedSessionCase {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    learnerId: "learner-1",
    sessionSource: {
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    },
    openingContext:
      "You are speaking with a finance operator who recently tried to improve month-end close.",
    customerPersona: {
      lightPersonaLabel: "Finance operator",
      interviewRole: "Controller",
      publicContext: "Owns reporting",
      privateConstraints: ["Budget owner is VP Finance"]
    },
    hiddenBackstory:
      "The operator rebuilt reports manually after a failed automation handoff.",
    customerFit: "strong-fit",
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
      text: "Sounds exciting.",
      metadata: {
        cue: "praise"
      }
    },
    {
      sequence: 3,
      turnId: "turn-3",
      speaker: "learner",
      text: "What did you try in the last month and who decides this?"
    }
  ];
}

function makeEvaluation(
  trapOutcome: "triggered" | "avoided" | "partial"
): SessionEvaluationArtifact {
  const evidence = [
    {
      sequence: 3,
      turnId: "turn-3",
      snippet: "What did you try in the last month and who decides this?",
      title: "Concrete history follow-up",
      detail: "The learner asked for a recent attempt and buyer decision."
    }
  ];

  return {
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
            detail: "Validation-seeking before concrete history."
          }
        ]
      },
      askingConcreteHistory: {
        outcome: "met",
        note: "Concrete history prompt detected.",
        evidence
      },
      followingUpOnVagueAnswers: {
        outcome: "met",
        note: "Vague praise followed with concrete prompt.",
        evidence
      },
      resistingCompliments: {
        outcome: "met",
        note: "Praise did not end discovery.",
        evidence
      },
      identifyingBadFitPersonas: {
        outcome: "partial",
        note: "Not central in this strong-fit transcript.",
        evidence: []
      },
      uncoveringWorkaroundsOrDecisionProcess: {
        outcome: "met",
        note: "Decision-process probing detected.",
        evidence
      }
    },
    learningSignal: {
      quality: "high",
      summary: "Learner extracted concrete process evidence.",
      evidence
    },
    trapResults: [
      {
        trapId: "trap-1",
        trapLabel: "Compliment Trap",
        outcome: trapOutcome,
        detail: "Learner partially recovered after social validation bait.",
        evidence
      }
    ],
    excludedDimensions: {
      accent: "not-scored",
      charisma: "not-scored",
      vocalPolish: "not-scored",
      soundingConfident: "not-scored"
    }
  };
}
