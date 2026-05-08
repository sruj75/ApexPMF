import type { GeneratedSessionCaseDraft } from "../persona/persona-generation";
import {
  presentSessionSource,
  type SessionSource
} from "../persona/session-source";
import {
  createInitialSessionLifecycleState,
  type SessionLifecycleState
} from "./session-lifecycle";
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
};

export type CreateGeneratedSessionCaseInput = GeneratedSessionCaseDraft & {
  sessionSource: SessionSource;
  generationNonce: string;
};

export type StartedSession = {
  sessionId: string;
  openingContext: string;
  sessionSourceLabel: string;
  lightPersonaLabel: string;
};

export function toStartedSession(
  generatedSessionCase: GeneratedSessionCase
): StartedSession {
  return {
    sessionId: generatedSessionCase.id,
    openingContext: generatedSessionCase.openingContext,
    sessionSourceLabel: sessionSourceLabel(generatedSessionCase.sessionSource),
    lightPersonaLabel:
      generatedSessionCase.customerPersona.lightPersonaLabel
  };
}

export function sessionSourceLabel(sessionSource: SessionSource): string {
  return presentSessionSource(sessionSource).label;
}

export function withDefaultSessionLifecycle(
  generatedSessionCase: Omit<
    GeneratedSessionCase,
    "sessionLifecycle" | "sessionReport" | "sessionTranscript"
  > & {
    sessionLifecycle?: SessionLifecycleState;
    sessionReport?: SessionReport | null;
    sessionTranscript?: SessionTranscriptTurn[] | null;
  }
): GeneratedSessionCase {
  return {
    ...generatedSessionCase,
    sessionLifecycle:
      generatedSessionCase.sessionLifecycle ??
      createInitialSessionLifecycleState(),
    sessionReport: generatedSessionCase.sessionReport ?? null,
    sessionTranscript: generatedSessionCase.sessionTranscript ?? null
  };
}
