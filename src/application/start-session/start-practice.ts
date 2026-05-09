import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import type {
  PersonaGenerationError,
  PersonaGenerator
} from "@/src/domain/persona/persona-generation";
import {
  resolveNextSessionSource,
  type SessionSourceResolutionError
} from "@/src/domain/persona/session-source";
import type { StartedSession } from "@/src/domain/session/generated-session-case";
import { toStartedSession } from "@/src/domain/session/generated-session-case";
import type {
  GeneratedSessionCaseRepository,
  GeneratedSessionCaseRepositoryError
} from "@/src/domain/session/generated-session-case-repository";
import { Data, Effect } from "effect";

export type StartPracticeDependencies = {
  idealCustomerProfileRepository: Pick<
    IdealCustomerProfileRepository,
    "getActiveForLearner"
  >;
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  personaGenerator: PersonaGenerator;
  createNonce?: () => string;
};

export class StartPracticeSessionSourceError extends Data.TaggedError(
  "StartPracticeSessionSourceError"
)<{
  learnerId: string;
  cause: SessionSourceResolutionError;
}> {}

export class StartPracticePersonaGenerationError extends Data.TaggedError(
  "StartPracticePersonaGenerationError"
)<{
  learnerId: string;
  cause: PersonaGenerationError;
}> {}

export type StartPracticeError =
  | StartPracticeSessionSourceError
  | StartPracticePersonaGenerationError
  | GeneratedSessionCaseRepositoryError;

export function normalizeStartPracticeFailure(cause: unknown): unknown {
  if (
    cause instanceof StartPracticePersonaGenerationError ||
    cause instanceof StartPracticeSessionSourceError
  ) {
    return cause.cause;
  }

  return cause;
}

export function startPracticeForLearner(
  learnerId: string,
  dependencies: StartPracticeDependencies
): Effect.Effect<StartedSession, StartPracticeError, never> {
  return Effect.gen(function* () {
    const generationNonce =
      dependencies.createNonce?.() ?? globalThis.crypto.randomUUID();
    const sessionSource = yield* resolveNextSessionSource(
      learnerId,
      dependencies.idealCustomerProfileRepository
    ).pipe(
      Effect.mapError(
        (cause) =>
          new StartPracticeSessionSourceError({
            learnerId,
            cause
          })
      )
    );
    const generatedDraft = yield* dependencies.personaGenerator
      .generateSessionCase({
        sessionSource,
        generationNonce
      })
      .pipe(
        Effect.mapError(
          (cause) =>
            new StartPracticePersonaGenerationError({
              learnerId,
              cause
            })
        )
      );
    const generatedSessionCase =
      yield* dependencies.generatedSessionCaseRepository.create(learnerId, {
        ...generatedDraft,
        sessionSource,
        generationNonce
      });

    return toStartedSession(generatedSessionCase);
  });
}
