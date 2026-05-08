import type { PersonaEvidenceRef } from "./session-report";
import type { TrapOutcome } from "./session-report";

export type BehaviorOutcome = "met" | "missed" | "partial";

export type BehaviorAssessment = {
  outcome: BehaviorOutcome;
  note: string;
  evidence: PersonaEvidenceRef[];
};

export type SessionEvaluationArtifact = {
  interviewBehavior: {
    avoidingPitching: BehaviorAssessment;
    askingConcreteHistory: BehaviorAssessment;
    followingUpOnVagueAnswers: BehaviorAssessment;
    resistingCompliments: BehaviorAssessment;
    identifyingBadFitPersonas: BehaviorAssessment;
    uncoveringWorkaroundsOrDecisionProcess: BehaviorAssessment;
  };
  learningSignal: {
    quality: "high" | "medium" | "low";
    summary: string;
    evidence: PersonaEvidenceRef[];
  };
  trapResults: Array<{
    trapId: string;
    trapLabel: string;
    outcome: TrapOutcome;
    detail: string;
    evidence: PersonaEvidenceRef[];
  }>;
  excludedDimensions: {
    accent: "not-scored";
    charisma: "not-scored";
    vocalPolish: "not-scored";
    soundingConfident: "not-scored";
  };
};

export type SessionEvaluationInsufficientReason =
  | "not-ended"
  | "user-quit"
  | "transcript-too-short"
  | "transcript-missing-speakers"
  | "provider-failure"
  | "invalid-judge-output";
