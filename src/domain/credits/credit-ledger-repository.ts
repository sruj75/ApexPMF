import type { CreditLedger } from "./credit-ledger";
import { Data, Effect } from "effect";

export type CreditLedgerRepositoryOperation =
  | "getOrInitializeForLearner"
  | "markFreeTrialUsed"
  | "applyCharge"
  | "applyRefund";

export class CreditLedgerRepositoryPersistenceError extends Data.TaggedError(
  "CreditLedgerRepositoryPersistenceError"
)<{
  operation: CreditLedgerRepositoryOperation;
  cause: unknown;
}> {}

export class CreditLedgerRepositoryDecodeError extends Data.TaggedError(
  "CreditLedgerRepositoryDecodeError"
)<{
  operation: CreditLedgerRepositoryOperation;
  cause: unknown;
}> {}

export type CreditLedgerRepositoryError =
  | CreditLedgerRepositoryPersistenceError
  | CreditLedgerRepositoryDecodeError;

export type CreditLedgerRepository = {
  getOrInitializeForLearner(
    learnerId: string
  ): Effect.Effect<CreditLedger, CreditLedgerRepositoryError>;
  markFreeTrialUsed(
    learnerId: string
  ): Effect.Effect<CreditLedger, CreditLedgerRepositoryError>;
  applyCharge(
    learnerId: string,
    credits: number
  ): Effect.Effect<CreditLedger, CreditLedgerRepositoryError>;
  applyRefund(
    learnerId: string,
    credits: number
  ): Effect.Effect<CreditLedger, CreditLedgerRepositoryError>;
};

export function createInMemoryCreditLedgerRepository(
  initialLedgers?: CreditLedger[]
): CreditLedgerRepository {
  const store = new Map<string, CreditLedger>();

  for (const ledger of initialLedgers ?? []) {
    store.set(ledger.learnerId, { ...ledger });
  }

  function getOrCreate(learnerId: string): CreditLedger {
    const existing = store.get(learnerId);
    if (existing) return existing;

    const fresh: CreditLedger = {
      learnerId,
      freeTrialUsed: false,
      subscriptionCredits: 0,
      topUpCredits: 0
    };
    store.set(learnerId, fresh);
    return fresh;
  }

  return {
    getOrInitializeForLearner(learnerId) {
      return Effect.succeed({ ...getOrCreate(learnerId) });
    },

    markFreeTrialUsed(learnerId) {
      const ledger = getOrCreate(learnerId);
      ledger.freeTrialUsed = true;
      return Effect.succeed({ ...ledger });
    },

    applyCharge(learnerId, credits) {
      const ledger = getOrCreate(learnerId);
      let remaining = credits;

      const fromSub = Math.min(remaining, ledger.subscriptionCredits);
      ledger.subscriptionCredits -= fromSub;
      remaining -= fromSub;

      ledger.topUpCredits -= remaining;

      return Effect.succeed({ ...ledger });
    },

    applyRefund(learnerId, credits) {
      const ledger = getOrCreate(learnerId);
      ledger.topUpCredits += credits;
      return Effect.succeed({ ...ledger });
    }
  };
}
