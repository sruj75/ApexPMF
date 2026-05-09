import type { GeneratedSessionCaseRepository } from "@/src/domain/session/generated-session-case-repository";
import type { IdealCustomerProfileRepository } from "@/src/domain/persona/ideal-customer-profile-repository";
import { createSupabaseGeneratedSessionCaseRepository } from "@/src/infrastructure/supabase/generated-session-cases";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import {
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

export type SupabaseLearnerEntryContextError =
  | SupabaseServerClientError
  | LearnerEntryContextDependencyError;

export function getSupabaseLearnerEntryContextEffect(): Effect.Effect<
  SupabaseLearnerEntryContextResult,
  SupabaseLearnerEntryContextError,
  never
> {
  return Effect.gen(function* () {
    const supabase = yield* createSupabaseServerClientEffect();
    const authResult = yield* Effect.tryPromise({
      try: () => supabase.auth.getUser(),
      catch: (cause) =>
        new LearnerEntryContextDependencyError({
          operation: "resolve-auth-user",
          cause
        })
    });
    const user = authResult.data.user;

    if (!user) {
      return {
        ok: false as const,
        reason: "unauthenticated" as const
      };
    }

    return {
      ok: true as const,
      learnerId: user.id,
      idealCustomerProfileRepository:
        createSupabaseIdealCustomerProfileRepository(supabase),
      generatedSessionCaseRepository:
        createSupabaseGeneratedSessionCaseRepository(supabase)
    };
  });
}

export async function getSupabaseLearnerEntryContext(): Promise<SupabaseLearnerEntryContextResult> {
  return Effect.runPromise(getSupabaseLearnerEntryContextEffect());
}
