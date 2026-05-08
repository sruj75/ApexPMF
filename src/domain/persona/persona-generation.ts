import type { SessionSource } from "./session-source";

export type CustomerFit =
  | "strong-fit"
  | "weak-fit"
  | "bad-fit"
  | "buyer-user-mismatch"
  | "influencer";

export type CustomerPersona = {
  lightPersonaLabel: string;
  interviewRole: string;
  publicContext: string;
  privateConstraints: readonly string[];
};

export type HiddenTestPlan = {
  focusAreas: readonly string[];
  successSignals: readonly string[];
  failureSignals: readonly string[];
};

export type ConversationalFrictionCue =
  | "hesitation"
  | "rambling"
  | "vague-answers"
  | "mild-discomfort"
  | "interruption"
  | "questions-back";

export type WeakQuestionSocialSignalCue =
  | "politeness"
  | "praise"
  | "speculation"
  | "vague-interest";

export type PersonaBehavior = {
  conversationalFriction: readonly ConversationalFrictionCue[];
  weakQuestionSocialSignals: readonly WeakQuestionSocialSignalCue[];
  strongQuestionTruthAnchors: readonly string[];
  trapDelivery: "natural-hidden";
};

export type Trap = {
  id: string;
  label: string;
  setup: string;
  weakBehavior: string;
};

export type GenerationAudit = {
  provider: string;
  model: string;
  responseId?: string;
};

export type PersonaGenerationInput = {
  sessionSource: SessionSource;
  // Uniquely identifies one generation attempt; used for persistence idempotency.
  generationNonce: string;
};

export type GeneratedSessionCaseDraft = {
  openingContext: string;
  customerPersona: CustomerPersona;
  hiddenBackstory: string;
  customerFit: CustomerFit;
  hiddenTestPlan: HiddenTestPlan;
  personaBehavior: PersonaBehavior;
  traps: readonly Trap[];
  generationAudit: GenerationAudit;
};

export interface PersonaGenerator {
  generateSessionCase(
    input: PersonaGenerationInput
  ): Promise<GeneratedSessionCaseDraft>;
}
