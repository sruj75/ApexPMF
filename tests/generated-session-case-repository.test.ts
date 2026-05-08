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
        createdAt: new Date("2026-05-01T00:00:00.000Z")
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
  });
});
