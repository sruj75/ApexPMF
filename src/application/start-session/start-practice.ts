import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import type {
  PersonaGenerationError
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
import {
  resolveSessionCreditContext
} from "@/src/domain/credits/credit-ledger";
import type {
  CreditLedgerRepository,
  CreditLedgerRepositoryError
} from "@/src/domain/credits/credit-ledger-repository";
import { PersonaGenerationCapability } from "@/src/application/llm-runtime/llm-runtime-layers";
import { Context, Data, Effect, Layer } from "effect";

export class StartPracticeNonce extends Context.Tag("StartPracticeNonce")<
  StartPracticeNonce,
  {
    create(): string;
  }
>() {}

export const defaultStartPracticeNonceLayer = Layer.succeed(StartPracticeNonce, {
  create: () => globalThis.crypto.randomUUID()
});

export type StartPracticeDependencies = {
  idealCustomerProfileRepository: Pick<
    IdealCustomerProfileRepository,
    "getActiveForLearner"
  >;
  generatedSessionCaseRepository: GeneratedSessionCaseRepository;
  creditLedgerRepository: CreditLedgerRepository;
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

export class StartPracticeInsufficientCreditsError extends Data.TaggedError(
  "StartPracticeInsufficientCreditsError"
)<{
  learnerId: string;
  availableCredits: number;
  minimumRequired: number;
}> {}

export type StartPracticeError =
  | StartPracticeSessionSourceError
  | StartPracticePersonaGenerationError
  | StartPracticeInsufficientCreditsError
  | GeneratedSessionCaseRepositoryError
  | CreditLedgerRepositoryError;

export function normalizeStartPracticeFailure(cause: unknown): unknown {
  if (
    cause instanceof StartPracticePersonaGenerationError ||
    cause instanceof StartPracticeSessionSourceError
  ) {
    return cause.cause;
  }

  if (cause instanceof StartPracticeInsufficientCreditsError) {
    return cause;
  }

  return cause;
}

export function startPracticeForLearner(
  learnerId: string,
  dependencies: StartPracticeDependencies
): Effect.Effect<
  StartedSession,
  StartPracticeError,
  PersonaGenerationCapability | StartPracticeNonce
> {
  return Effect.gen(function* () {
    const ledger = yield* dependencies.creditLedgerRepository.getOrInitializeForLearner(
      learnerId
    );
    const creditContext = resolveSessionCreditContext(ledger);

    if (creditContext.kind === "insufficient-credits") {
      return yield* Effect.fail(
        new StartPracticeInsufficientCreditsError({
          learnerId,
          availableCredits: creditContext.availableCredits,
          minimumRequired: creditContext.minimumRequired
        })
      );
    }

    const personaGenerator = yield* PersonaGenerationCapability;
    const nonce = yield* StartPracticeNonce;
    const generationNonce = nonce.create();
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
    const generatedDraft = yield* personaGenerator
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

    if (creditContext.kind === "free-trial") {
      yield* dependencies.creditLedgerRepository.markFreeTrialUsed(learnerId);
    }

    return toStartedSession(generatedSessionCase, creditContext);
  });
}
