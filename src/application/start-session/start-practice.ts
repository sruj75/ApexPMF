import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import type { PersonaGenerator } from "@/src/domain/persona/persona-generation";
import { resolveNextSessionSource } from "@/src/domain/persona/session-source";
import type { StartedSession } from "@/src/domain/session/generated-session-case";
import { toStartedSession } from "@/src/domain/session/generated-session-case";
import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";

export type StartPracticeDependencies = {
  idealCustomerProfileRepository: Pick<
    IdealCustomerProfileRepository,
    "getActiveForLearner"
  >;
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  personaGenerator: PersonaGenerator;
  createNonce?: () => string;
};

export async function startPracticeForLearner(
  learnerId: string,
  dependencies: StartPracticeDependencies
): Promise<StartedSession> {
  const generationNonce =
    dependencies.createNonce?.() ?? globalThis.crypto.randomUUID();
  const sessionSource = await resolveNextSessionSource(
    learnerId,
    dependencies.idealCustomerProfileRepository
  );
  const generatedDraft =
    await dependencies.personaGenerator.generateSessionCase({
      sessionSource,
      generationNonce
    });
  const generatedSessionCase =
    await dependencies.generatedSessionCaseRepository.create(learnerId, {
      ...generatedDraft,
      sessionSource,
      generationNonce
    });

  return toStartedSession(generatedSessionCase);
}
