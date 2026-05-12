import type { SupabaseClient } from "@supabase/supabase-js";
import { Effect, Schema } from "effect";
import type { CreditLedger } from "@/src/domain/credits/credit-ledger";
import {
  CreditLedgerRepositoryDecodeError,
  CreditLedgerRepositoryPersistenceError,
  type CreditLedgerRepository,
  type CreditLedgerRepositoryOperation
} from "@/src/domain/credits/credit-ledger-repository";
import { formatParseErrorDetails } from "./supabase-row-decode-error";

const creditLedgerColumns =
  "learner_id, free_trial_used, subscription_credits, top_up_credits";

const CreditLedgerRowSchema = Schema.Struct({
  learner_id: Schema.String,
  free_trial_used: Schema.Boolean,
  subscription_credits: Schema.Number,
  top_up_credits: Schema.Number
});

type CreditLedgerRow = Schema.Schema.Type<typeof CreditLedgerRowSchema>;

export function createSupabaseCreditLedgerRepository(
  supabase: SupabaseClient
): CreditLedgerRepository {
  return {
    getOrInitializeForLearner(learnerId) {
      return Effect.gen(function* () {
        const existing = yield* queryCreditLedger({
          operation: "getOrInitializeForLearner",
          run: () =>
            supabase
              .from("credit_ledgers")
              .select(creditLedgerColumns)
              .eq("learner_id", learnerId)
              .maybeSingle()
        });

        if (existing.data) {
          return yield* decodeCreditLedger(existing.data, "getOrInitializeForLearner");
        }

        const created = yield* queryCreditLedger({
          operation: "getOrInitializeForLearner",
          run: () =>
            supabase
              .from("credit_ledgers")
              .insert({ learner_id: learnerId })
              .select(creditLedgerColumns)
              .single()
        });

        return yield* decodeCreditLedger(created.data, "getOrInitializeForLearner");
      });
    },

    markFreeTrialUsed(learnerId) {
      return mutateLedger({
        supabase,
        learnerId,
        operation: "markFreeTrialUsed",
        patch: { free_trial_used: true }
      });
    },

    applyCharge(learnerId, credits) {
      return Effect.gen(function* () {
        const current = yield* ensureLedger(supabase, learnerId);
        const subscriptionCharge = Math.min(credits, current.subscriptionCredits);
        const topUpCharge = Math.max(0, credits - subscriptionCharge);

        return yield* mutateLedger({
          supabase,
          learnerId,
          operation: "applyCharge",
          patch: {
            subscription_credits: current.subscriptionCredits - subscriptionCharge,
            top_up_credits: current.topUpCredits - topUpCharge
          }
        });
      });
    },

    applyRefund(learnerId, credits) {
      return Effect.gen(function* () {
        const current = yield* ensureLedger(supabase, learnerId);
        return yield* mutateLedger({
          supabase,
          learnerId,
          operation: "applyRefund",
          patch: {
            top_up_credits: current.topUpCredits + credits
          }
        });
      });
    }
  };
}

function ensureLedger(supabase: SupabaseClient, learnerId: string) {
  return createSupabaseCreditLedgerRepository(supabase).getOrInitializeForLearner(
    learnerId
  );
}

function mutateLedger(input: {
  supabase: SupabaseClient;
  learnerId: string;
  operation: CreditLedgerRepositoryOperation;
  patch: Record<string, number | boolean>;
}) {
  return Effect.gen(function* () {
    yield* ensureLedger(input.supabase, input.learnerId);
    const updated = yield* queryCreditLedger({
      operation: input.operation,
      run: () =>
        input.supabase
          .from("credit_ledgers")
          .update(input.patch)
          .eq("learner_id", input.learnerId)
          .select(creditLedgerColumns)
          .single()
    });

    return yield* decodeCreditLedger(updated.data, input.operation);
  });
}

function queryCreditLedger<T>(input: {
  operation: CreditLedgerRepositoryOperation;
  run: () => PromiseLike<{ data: T; error: { message: string } | null }>;
}) {
  return Effect.tryPromise({
    try: input.run,
    catch: (cause) =>
      new CreditLedgerRepositoryPersistenceError({
        operation: input.operation,
        cause
      })
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(
            new CreditLedgerRepositoryPersistenceError({
              operation: input.operation,
              cause: new Error(result.error.message)
            })
          )
        : Effect.succeed(result)
    )
  );
}

function decodeCreditLedger(
  row: unknown,
  operation: CreditLedgerRepositoryOperation
): Effect.Effect<CreditLedger, CreditLedgerRepositoryDecodeError> {
  const decoded = Schema.decodeUnknownEither(CreditLedgerRowSchema)(row);
  if (decoded._tag === "Left") {
    return Effect.fail(
      new CreditLedgerRepositoryDecodeError({
        operation,
        cause: formatParseErrorDetails(decoded.left)
      })
    );
  }

  return Effect.succeed(toCreditLedger(decoded.right));
}

function toCreditLedger(row: CreditLedgerRow): CreditLedger {
  return {
    learnerId: row.learner_id,
    freeTrialUsed: row.free_trial_used,
    subscriptionCredits: row.subscription_credits,
    topUpCredits: row.top_up_credits
  };
}
