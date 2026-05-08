import { describe, expect, it } from "vitest";
import { createReportGenerationCoordinator } from "../src/application/generate-report/report-generation-coordinator";
import type { GeneratedSessionCase } from "../src/domain/session/generated-session-case";

describe("Report generation coordinator", () => {
  it("runs hidden evaluation and returns report artifacts for ended non-quit sessions", async () => {
    const coordinator = createReportGenerationCoordinator();

    const result = await coordinator.generateForEndedSession({
      generatedSessionCase: makeGeneratedSessionCase("natural-conclusion")
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("Expected ready report generation result.");
    }

    expect(result.report.trapResults.length).toBeGreaterThan(0);
    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.evaluation.learningSignal.quality).toMatch(/high|medium|low/);
  });

  it("returns insufficient-evidence for user-quit sessions", async () => {
    const coordinator = createReportGenerationCoordinator();

    await expect(
      coordinator.generateForEndedSession({
        generatedSessionCase: makeGeneratedSessionCase("user-quit")
      })
    ).resolves.toEqual({
      status: "insufficient-evidence"
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
