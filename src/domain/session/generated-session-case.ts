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
import type {
  SessionChargeResult,
  SessionCreditContext
} from "../credits/credit-ledger";

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
  creditContext: PersistedSessionCreditContext;
  creditCharge: SessionChargeResult | null;
};

export type CreateGeneratedSessionCaseInput = GeneratedSessionCaseDraft & {
  sessionSource: SessionSource;
  generationNonce: string;
  creditContext: PersistedSessionCreditContext;
};

export type PersistedSessionCreditContext = Exclude<
  SessionCreditContext,
  { kind: "insufficient-credits" }
>;

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
  generatedSessionCase: GeneratedSessionCase
): StartedSession {
  const resolvedCreditContext: StartedSessionCreditContext =
    generatedSessionCase.creditContext.kind === "free-trial"
      ? { kind: "free-trial" }
      : {
          kind: "paid",
          estimatedCredits: generatedSessionCase.creditContext.estimatedCredits
        };

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
    | "creditCharge"
  > & {
    sessionLifecycle?: SessionLifecycleState;
    sessionReport?: SessionReport | null;
    sessionTranscript?: SessionTranscriptTurn[] | null;
    sessionEvaluation?: SessionEvaluationArtifact | null;
    creditCharge?: SessionChargeResult | null;
  }
): GeneratedSessionCase {
  return {
    ...generatedSessionCase,
    sessionLifecycle:
      generatedSessionCase.sessionLifecycle ??
      createInitialSessionLifecycleState(),
    sessionReport: generatedSessionCase.sessionReport ?? null,
    sessionTranscript: generatedSessionCase.sessionTranscript ?? null,
    sessionEvaluation: generatedSessionCase.sessionEvaluation ?? null,
    creditCharge: generatedSessionCase.creditCharge ?? null
  };
}
