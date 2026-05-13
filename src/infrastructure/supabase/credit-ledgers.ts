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
        const result = yield* queryCreditLedger({
          operation: "getOrInitializeForLearner",
          run: () =>
            supabase.rpc("ensure_credit_ledger", {
              p_learner_id: learnerId
            })
        });

        return yield* decodeCreditLedger(result.data, "getOrInitializeForLearner");
      });
    },

    markFreeTrialUsed(learnerId) {
      return callLedgerMutation({
        supabase,
        learnerId,
        operation: "markFreeTrialUsed",
        rpc: "mark_credit_ledger_free_trial_used"
      });
    },

    applyCharge(learnerId, credits) {
      return callLedgerMutation({
        supabase,
        learnerId,
        operation: "applyCharge",
        rpc: "apply_credit_ledger_charge",
        credits
      });
    },

    applyRefund(learnerId, credits) {
      return callLedgerMutation({
        supabase,
        learnerId,
        operation: "applyRefund",
        rpc: "apply_credit_ledger_refund",
        credits
      });
    }
  };
}

function callLedgerMutation(input: {
  supabase: SupabaseClient;
  learnerId: string;
  operation: CreditLedgerRepositoryOperation;
  rpc:
    | "mark_credit_ledger_free_trial_used"
    | "apply_credit_ledger_charge"
    | "apply_credit_ledger_refund";
  credits?: number;
}) {
  return Effect.gen(function* () {
    const updated = yield* queryCreditLedger({
      operation: input.operation,
      run: () =>
        input.supabase.rpc(input.rpc, {
          p_learner_id: input.learnerId,
          ...(input.credits === undefined ? {} : { p_credits: input.credits })
        })
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
