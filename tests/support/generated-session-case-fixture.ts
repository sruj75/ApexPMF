import type { GeneratedSessionCase } from "@/src/domain/session/generated-session-case";
import { createInitialSessionLifecycleState } from "@/src/domain/session/session-lifecycle";

export const defaultPracticeSessionId = "123e4567-e89b-12d3-a456-426614174000";

export function makeGeneratedSessionCase(
  overrides: Partial<GeneratedSessionCase> & {
    id?: string;
    sessionLifecycle?: Partial<GeneratedSessionCase["sessionLifecycle"]>;
  } = {}
): GeneratedSessionCase {
  return {
    id: overrides.id ?? defaultPracticeSessionId,
    learnerId: overrides.learnerId ?? "learner-1",
    sessionSource: overrides.sessionSource ?? {
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    },
    generationNonce: overrides.generationNonce ?? "nonce-1",
    createdAt: overrides.createdAt ?? new Date("2026-05-09T00:00:00.000Z"),
    openingContext: overrides.openingContext ?? "Opening context",
    customerPersona: overrides.customerPersona ?? {
      lightPersonaLabel: "Finance operator",
      interviewRole: "Controller",
      publicContext: "Owns reporting",
      privateConstraints: ["Budget owner is VP Finance"]
    },
    hiddenBackstory: overrides.hiddenBackstory ?? "Hidden backstory",
    customerFit: overrides.customerFit ?? "strong-fit",
    hiddenTestPlan: overrides.hiddenTestPlan ?? {
      focusAreas: ["Concrete History"],
      successSignals: ["Asked about recent attempts"],
      failureSignals: ["Accepted vague praise"]
    },
    personaBehavior: overrides.personaBehavior ?? {
      conversationalFriction: [
        "hesitation",
        "rambling",
        "vague-answers",
        "mild-discomfort",
        "interruption",
        "questions-back"
      ],
      weakQuestionSocialSignals: ["politeness", "praise", "speculation", "vague-interest"],
      strongQuestionTruthAnchors: ["paid-consultant-attempt", "manual-rebuild-weekend"],
      trapDelivery: "natural-hidden"
    },
    traps: overrides.traps ?? [
      {
        id: "trap-1",
        label: "Compliment Trap",
        setup: "Persona praises the pitch.",
        weakBehavior: "Learner accepts praise as validation."
      }
    ],
    generationAudit: overrides.generationAudit ?? {
      provider: "test",
      model: "test-model"
    },
    sessionLifecycle: {
      ...createInitialSessionLifecycleState(),
      ...overrides.sessionLifecycle
    },
    sessionReport: overrides.sessionReport ?? null,
    sessionTranscript: overrides.sessionTranscript ?? null,
    sessionEvaluation: overrides.sessionEvaluation ?? null,
    creditContext: overrides.creditContext ?? {
      kind: "free-trial",
      maxDurationMinutes: 15
    },
    creditCharge: overrides.creditCharge ?? null
  };
}

export function makeSessionReport() {
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
      description: "Follow praise with a concrete history question."
    },
    sourceContext: "Broad Practice Pool",
    lightPersonaLabel: "Finance operator",
    expandableEvidence: []
  };
}

export function makeReportPageSessionReport(
  trapOutcome: "triggered" | "avoided" | "partial" = "triggered"
) {
  const trapDetail =
    trapOutcome === "partial"
      ? "Learner accepted praise then recovered with follow-up."
      : "Learner accepted praise as validation.";

  return {
    outcome: {
      summary: "Session ended with reason: natural-conclusion."
    },
    missedSignals: [
      {
        title: "Polite praise treated as validation",
        detail: "Positive language was interpreted as buying intent.",
        evidence: [
          {
            sequence: 1,
            title: "Early social signal",
            detail: "The first turn invited speculation.",
            snippet: "Would this be useful for your team?"
          }
        ]
      }
    ],
    badQuestions: [
      {
        question: "Would this be useful for your team?",
        whyItMissed: "Allowed speculative sentiment.",
        evidence: []
      }
    ],
    strongQuestions: [
      {
        question: "What did you try in the last month?",
        whyItWorked: "Prompted concrete history.",
        evidence: []
      }
    ],
    trapResults: [
      {
        trapLabel: "Compliment Trap",
        outcome: trapOutcome,
        detail: trapDetail,
        evidence: []
      }
    ],
    skillMovement: [
      {
        skill: "Concrete History",
        movement: "flat",
        rationale: "Strong follow-up came late."
      }
    ],
    nextPracticeFocus: {
      title: "Ask behavior-first follow-ups",
      description: "Follow praise with a concrete history question."
    },
    sourceContext: "Broad Practice Pool",
    lightPersonaLabel: "Finance operator",
    expandableEvidence: [
      {
        sequence: 1,
        turnId: "turn-1",
        title: "Asked concrete history follow-up",
        detail: "Follow-up moved from speculation toward observable customer behavior.",
        snippet: "What did you try recently?"
      }
    ]
  };
}

export function makeReportPageTranscript() {
  return [
    {
      sequence: 1,
      turnId: "turn-1",
      speaker: "learner" as const,
      text: "What did you try recently?"
    },
    {
      sequence: 2,
      turnId: "turn-2",
      speaker: "persona" as const,
      text: "We paid a consultant and still rebuilt reports manually."
    }
  ];
}

export function makeSessionEvaluation() {
  return {
    interviewBehavior: {
      avoidingPitching: { outcome: "met" as const, note: "ok", evidence: [] },
      askingConcreteHistory: { outcome: "met" as const, note: "ok", evidence: [] },
      followingUpOnVagueAnswers: {
        outcome: "met" as const,
        note: "ok",
        evidence: []
      },
      resistingCompliments: { outcome: "met" as const, note: "ok", evidence: [] },
      identifyingBadFitPersonas: {
        outcome: "partial" as const,
        note: "ok",
        evidence: []
      },
      uncoveringWorkaroundsOrDecisionProcess: {
        outcome: "met" as const,
        note: "ok",
        evidence: []
      }
    },
    learningSignal: {
      quality: "medium" as const,
      summary: "Useful discovery evidence appeared.",
      evidence: []
    },
    trapResults: [],
    excludedDimensions: {
      accent: "not-scored" as const,
      charisma: "not-scored" as const,
      vocalPolish: "not-scored" as const,
      soundingConfident: "not-scored" as const
    }
  };
}
