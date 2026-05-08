import { describe, expect, it } from "vitest";
import { createPersonaBehaviorEngine } from "../src/domain/persona/persona-behavior-engine";

describe("Persona Behavior Engine", () => {
  it("returns unreliable social-signal cues for weak questions and truthful concrete-history cues for strong questions", () => {
    const engine = createPersonaBehaviorEngine();
    const generatedSessionCase = {
      id: "session-case-1",
      learnerId: "learner-1",
      sessionSource: {
        kind: "broad-practice-pool" as const,
        label: "Broad Practice Pool"
      },
      generationNonce: "nonce-1",
      createdAt: new Date("2026-05-08T00:00:00.000Z"),
      openingContext: "Opening Context",
      customerPersona: {
        lightPersonaLabel: "SaaS controller",
        interviewRole: "Controller",
        publicContext: "Owns reporting",
        privateConstraints: ["Budget owner is VP Finance"]
      },
      hiddenBackstory:
        "Last quarter they paid a consultant and still rebuilt reports manually.",
      customerFit: "strong-fit" as const,
      hiddenTestPlan: {
        focusAreas: ["Concrete History"],
        successSignals: ["Asks about specific prior attempts"],
        failureSignals: ["Accepts compliments without probing"]
      },
      traps: [
        {
          id: "trap-1",
          label: "Compliment Trap",
          setup: "Persona praises the product direction.",
          weakBehavior: "Learner treats praise as validation."
        }
      ],
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
      generationAudit: {
        provider: "test",
        model: "fake-model"
      }
    };

    const weakDirective = engine.selectPersonaResponse({
      generatedSessionCase,
      questionSignal: "weak"
    });
    expect(weakDirective).toMatchObject({
      mode: "social-signal",
      trapVisibility: "hidden",
      allowedSocialSignals: ["politeness", "praise", "speculation", "vague-interest"],
      coherenceGuard: true
    });

    const strongDirective = engine.selectPersonaResponse({
      generatedSessionCase,
      questionSignal: "strong"
    });
    expect(strongDirective).toMatchObject({
      mode: "concrete-history-truth",
      trapVisibility: "hidden",
      truthfulnessPolicy: "must-anchor-to-generated-case",
      concreteHistoryAnchors: [
        "paid-consultant-attempt",
        "manual-rebuild-weekend"
      ],
      coherenceGuard: true
    });
  });

  it("keeps conversational friction cues available and trap visibility hidden for neutral turns", () => {
    const engine = createPersonaBehaviorEngine();
    const generatedSessionCase = {
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
        trapDelivery: "natural-hidden" as const
      }
    };

    const neutralDirective = engine.selectPersonaResponse({
      generatedSessionCase,
      questionSignal: "neutral"
    });

    expect(neutralDirective).toMatchObject({
      trapVisibility: "hidden",
      coherenceGuard: true,
      conversationalFriction: [
        "hesitation",
        "rambling",
        "vague-answers",
        "mild-discomfort",
        "interruption",
        "questions-back"
      ]
    });
  });
});
