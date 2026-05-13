import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import type { CreditLedgerRepository } from "@/src/domain/credits/credit-ledger-repository";
import { createSupabaseCreditLedgerRepository } from "@/src/infrastructure/supabase/credit-ledgers";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import {
  createSupabaseAdminClientEffect,
  createSupabaseServerClientEffect,
  type SupabaseServerClientError
} from "@/src/infrastructure/supabase/server";
import { Data, Effect } from "effect";

export type SupabaseLearnerEntryContextResult =
  | {
      ok: true;
      learnerId: string;
      idealCustomerProfileRepository: IdealCustomerProfileRepository;
      generatedSessionCaseRepository: GeneratedSessionCaseRepository;
      creditLedgerRepository: CreditLedgerRepository;
    }
  | {
      ok: false;
      reason: "unauthenticated";
    };

export class LearnerEntryContextDependencyError extends Data.TaggedError(
  "LearnerEntryContextDependencyError"
)<{
  operation: "resolve-auth-user";
  cause: unknown;
}> {}

export class LearnerEntryContextAuthQueryError extends Data.TaggedError(
  "LearnerEntryContextAuthQueryError"
)<{
  operation: "resolve-auth-user";
  message: string;
}> {}

export type SupabaseLearnerEntryContextError =
  | SupabaseServerClientError
  | LearnerEntryContextDependencyError
  | LearnerEntryContextAuthQueryError;

export function getSupabaseLearnerEntryContextEffect(): Effect.Effect<
  SupabaseLearnerEntryContextResult,
  SupabaseLearnerEntryContextError,
  never
> {
  return Effect.gen(function* () {
    const supabase = yield* createSupabaseServerClientEffect();
    const authResult = yield* Effect.tryPromise({
      try: async () => supabase.auth.getUser(),
      catch: (cause) =>
        new LearnerEntryContextDependencyError({
          operation: "resolve-auth-user",
          cause
        })
    });

    if (authResult.error) {
      return yield* Effect.fail(
        new LearnerEntryContextAuthQueryError({
          operation: "resolve-auth-user",
          message: authResult.error.message
        })
      );
    }

    const user = authResult.data.user;

    if (!user) {
      return {
        ok: false as const,
        reason: "unauthenticated" as const
      };
    }

    const creditSupabase = yield* createSupabaseAdminClientEffect();

    return {
      ok: true as const,
      learnerId: user.id,
      idealCustomerProfileRepository:
        createSupabaseIdealCustomerProfileRepository(supabase),
      generatedSessionCaseRepository:
        createSupabaseGeneratedSessionCaseRepository(supabase),
      creditLedgerRepository: createSupabaseCreditLedgerRepository(creditSupabase)
    };
  });
}

export async function getSupabaseLearnerEntryContext(): Promise<SupabaseLearnerEntryContextResult> {
  return Effect.runPromise(getSupabaseLearnerEntryContextEffect());
}
