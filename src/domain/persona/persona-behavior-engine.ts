export type QuestionSignal = "weak" | "strong" | "neutral";

export type PersonaResponseDirective =
  | {
      mode: "social-signal";
      trapVisibility: "hidden";
      allowedSocialSignals: readonly string[];
      conversationalFriction: readonly string[];
      coherenceGuard: true;
    }
  | {
      mode: "concrete-history-truth";
      trapVisibility: "hidden";
      truthfulnessPolicy: "must-anchor-to-generated-case";
      concreteHistoryAnchors: readonly string[];
      conversationalFriction: readonly string[];
      coherenceGuard: true;
    };

type PersonaBehavior = {
  conversationalFriction: readonly string[];
  weakQuestionSocialSignals: readonly string[];
  strongQuestionTruthAnchors: readonly string[];
  trapDelivery: "natural-hidden";
};

type SelectPersonaResponseInput = {
  generatedSessionCase: {
    personaBehavior: PersonaBehavior;
  };
  questionSignal: QuestionSignal;
};

export function createPersonaBehaviorEngine() {
  return {
    selectPersonaResponse(input: SelectPersonaResponseInput): PersonaResponseDirective {
      const behavior = input.generatedSessionCase.personaBehavior;

      if (input.questionSignal === "strong") {
        return {
          mode: "concrete-history-truth",
          trapVisibility: "hidden",
          truthfulnessPolicy: "must-anchor-to-generated-case",
          concreteHistoryAnchors: behavior.strongQuestionTruthAnchors,
          conversationalFriction: behavior.conversationalFriction,
          coherenceGuard: true
        };
      }

      return {
        mode: "social-signal",
        trapVisibility: "hidden",
        allowedSocialSignals: behavior.weakQuestionSocialSignals,
        conversationalFriction: behavior.conversationalFriction,
        coherenceGuard: true
      };
    }
  };
}
