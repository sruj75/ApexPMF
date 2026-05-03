import type { GeneratedSessionCaseDraft } from "../persona/persona-generation";
import type { SessionSource } from "../persona/session-source";

export type GeneratedSessionCase = GeneratedSessionCaseDraft & {
  id: string;
  learnerId: string;
  sessionSource: SessionSource;
  generationNonce: string;
  createdAt: Date;
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
  if (sessionSource.kind === "active-ideal-customer-profile") {
    return sessionSource.idealCustomerProfile.name;
  }

  return sessionSource.label;
}
