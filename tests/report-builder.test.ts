import { describe, expect, it } from "vitest";
import { createDeterministicReportBuilder } from "../src/domain/session/report-builder";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";

describe("Report Builder", () => {
  it("returns a structured report with transcript evidence for ended non-quit sessions", async () => {
    const reportBuilder = createDeterministicReportBuilder();

    const result = await reportBuilder.buildForEndedSession({
      generatedSessionCase: makeGeneratedSessionCase()
    });

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("Expected ready report output.");
    }

    expect(result.report.outcome.summary).toMatch(/ended with reason/i);
    expect(result.report.missedSignals.length).toBeGreaterThan(0);
    expect(result.report.badQuestions.length).toBeGreaterThan(0);
    expect(result.report.strongQuestions.length).toBeGreaterThan(0);
    expect(result.report.trapResults.length).toBeGreaterThan(0);
    expect(result.report.skillMovement.length).toBeGreaterThan(0);
    expect(result.report.nextPracticeFocus.title.length).toBeGreaterThan(0);
    expect(result.report.sourceContext.length).toBeGreaterThan(0);
    expect(result.report.lightPersonaLabel).toBe("Finance operator");
    expect(result.report.expandableEvidence.length).toBeGreaterThan(0);

    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.transcript[0]).toMatchObject({
      speaker: "learner",
      sequence: 1
    });
    expect(result.report.expandableEvidence[0]?.sequence).toBe(1);
  });

  it("returns insufficient-evidence for user-quit sessions", async () => {
    const reportBuilder = createDeterministicReportBuilder();
    const generatedSessionCase = makeGeneratedSessionCase();
    generatedSessionCase.sessionLifecycle = {
      ...generatedSessionCase.sessionLifecycle,
      endedReason: "user-quit"
    };

    const result = await reportBuilder.buildForEndedSession({
      generatedSessionCase
    });

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
    sessionTranscript: null
  };
}
