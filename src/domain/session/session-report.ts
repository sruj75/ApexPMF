export type TranscriptSpeaker = "learner" | "persona";

export type SessionTranscriptTurn = {
  sequence: number;
  turnId?: string;
  speaker: TranscriptSpeaker;
  text: string;
  metadata?: {
    cue?: string;
    latencyMs?: number;
  };
};

export type PersonaEvidenceRef = {
  sequence: number;
  turnId?: string;
  snippet?: string;
  title: string;
  detail: string;
};

export type TrapOutcome = "triggered" | "avoided" | "partial";

export type SessionReport = {
  outcome: {
    summary: string;
  };
  missedSignals: Array<{
    title: string;
    detail: string;
    evidence: PersonaEvidenceRef[];
  }>;
  badQuestions: Array<{
    question: string;
    whyItMissed: string;
    evidence: PersonaEvidenceRef[];
  }>;
  strongQuestions: Array<{
    question: string;
    whyItWorked: string;
    evidence: PersonaEvidenceRef[];
  }>;
  trapResults: Array<{
    trapLabel: string;
    outcome: TrapOutcome;
    detail: string;
    evidence: PersonaEvidenceRef[];
  }>;
  skillMovement: Array<{
    skill: string;
    movement: "up" | "flat" | "down";
    rationale: string;
  }>;
  nextPracticeFocus: {
    title: string;
    description: string;
  };
  sourceContext: string;
  lightPersonaLabel: string;
  expandableEvidence: PersonaEvidenceRef[];
};
