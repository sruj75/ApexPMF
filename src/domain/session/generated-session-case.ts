import type { GeneratedSessionCaseDraft } from "../persona/persona-generation";
import {
  presentSessionSource,
  type SessionSource
} from "../persona/session-source";
import {
  createInitialSessionLifecycleState,
  type SessionLifecycleState
} from "./session-lifecycle";
import type { SessionEvaluationArtifact } from "./session-evaluation";
import type { SessionReport, SessionTranscriptTurn } from "./session-report";

export type GeneratedSessionCase = GeneratedSessionCaseDraft & {
  id: string;
  learnerId: string;
  sessionSource: SessionSource;
  generationNonce: string;
  createdAt: Date;
  sessionLifecycle: SessionLifecycleState;
  sessionReport: SessionReport | null;
  sessionTranscript: SessionTranscriptTurn[] | null;
  sessionEvaluation: SessionEvaluationArtifact | null;
};

export type CreateGeneratedSessionCaseInput = GeneratedSessionCaseDraft & {
  sessionSource: SessionSource;
  generationNonce: string;
};

export type StartedSessionCreditContext =
  | { kind: "free-trial" }
  | { kind: "paid"; estimatedCredits: number };

export type StartedSession = {
  sessionId: string;
  openingContext: string;
  sessionSourceLabel: string;
  lightPersonaLabel: string;
  creditContext: StartedSessionCreditContext;
};

export function toStartedSession(
  generatedSessionCase: GeneratedSessionCase,
  creditContext?: { kind: "free-trial" } | { kind: "paid"; estimatedCredits: number; availableCredits: number }
): StartedSession {
  const resolvedCreditContext: StartedSessionCreditContext = creditContext
    ? creditContext.kind === "free-trial"
      ? { kind: "free-trial" }
      : { kind: "paid", estimatedCredits: creditContext.estimatedCredits }
    : { kind: "free-trial" };

  return {
    sessionId: generatedSessionCase.id,
    openingContext: generatedSessionCase.openingContext,
    sessionSourceLabel: sessionSourceLabel(generatedSessionCase.sessionSource),
    lightPersonaLabel:
      generatedSessionCase.customerPersona.lightPersonaLabel,
    creditContext: resolvedCreditContext
  };
}

export function sessionSourceLabel(sessionSource: SessionSource): string {
  return presentSessionSource(sessionSource).label;
}

export function withDefaultSessionLifecycle(
  generatedSessionCase: Omit<
    GeneratedSessionCase,
    | "sessionLifecycle"
    | "sessionReport"
    | "sessionTranscript"
    | "sessionEvaluation"
  > & {
    sessionLifecycle?: SessionLifecycleState;
    sessionReport?: SessionReport | null;
    sessionTranscript?: SessionTranscriptTurn[] | null;
    sessionEvaluation?: SessionEvaluationArtifact | null;
  }
): GeneratedSessionCase {
  return {
    ...generatedSessionCase,
    sessionLifecycle:
      generatedSessionCase.sessionLifecycle ??
      createInitialSessionLifecycleState(),
    sessionReport: generatedSessionCase.sessionReport ?? null,
    sessionTranscript: generatedSessionCase.sessionTranscript ?? null,
    sessionEvaluation: generatedSessionCase.sessionEvaluation ?? null
  };
}
