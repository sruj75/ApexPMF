import { describe, expect, it } from "vitest";
import { finalizeSessionCredits } from "../src/application/end-session/finalize-session-credits";
import { createInMemoryCreditLedgerRepository } from "../src/domain/credits/credit-ledger-repository";
import { Effect } from "effect";

const learnerId = "learner-1";

describe("Finalize Session Credits", () => {
  it("charges nothing for a Free Trial Session", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository();

    const result = await Effect.runPromise(
      finalizeSessionCredits({
        learnerId,
        sessionCreditContext: { kind: "free-trial", maxDurationMinutes: 15 },
        reason: "natural-conclusion",
        actualDurationMinutes: 12,
        usableDurationMinutes: 12,
        creditLedgerRepository
      })
    );

    expect(result).toEqual({ kind: "free-trial", creditsCharged: 0 });
  });

  it("charges rounded duration for a paid Session", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 5, topUpCredits: 0 }
    ]);

    const result = await Effect.runPromise(
      finalizeSessionCredits({
        learnerId,
        sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
        reason: "natural-conclusion",
        actualDurationMinutes: 7,
        usableDurationMinutes: 7,
        creditLedgerRepository
      })
    );

    expect(result).toEqual({
      kind: "charged",
      billed: {
        actualDurationMinutes: 7,
        billedDurationMinutes: 10,
        creditsCharged: 2
      }
    });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(3);
  });

  it("charges up to available Credits on Credit Exhaustion", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 2, topUpCredits: 0 }
    ]);

    const result = await Effect.runPromise(
      finalizeSessionCredits({
        learnerId,
        sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 2 },
        reason: "credit-exhaustion",
        actualDurationMinutes: 11,
        usableDurationMinutes: 11,
        creditLedgerRepository
      })
    );

    expect(result).toEqual({
      kind: "charged",
      billed: {
        actualDurationMinutes: 11,
        billedDurationMinutes: 15,
        creditsCharged: 2
      }
    });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(0);
  });

  it("charges only for usable time on Voice Failure and refunds the rest", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 5, topUpCredits: 0 }
    ]);

    const result = await Effect.runPromise(
      finalizeSessionCredits({
        learnerId,
        sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
        reason: "voice-failure",
        actualDurationMinutes: 12,
        usableDurationMinutes: 8,
        creditLedgerRepository
      })
    );

    expect(result).toEqual({
      kind: "refunded",
      originalCharge: 3,
      refundedCredits: 1,
      reason: "voice-failure"
    });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(3);
  });

  it("charges nothing when Voice Failure happens at minute zero", async () => {
    const creditLedgerRepository = createInMemoryCreditLedgerRepository([
      { learnerId, freeTrialUsed: true, subscriptionCredits: 5, topUpCredits: 0 }
    ]);

    const result = await Effect.runPromise(
      finalizeSessionCredits({
        learnerId,
        sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
        reason: "voice-failure",
        actualDurationMinutes: 0,
        usableDurationMinutes: 0,
        creditLedgerRepository
      })
    );

    expect(result).toEqual({
      kind: "not-charged",
      reason: "voice-failure"
    });

    const ledger = await Effect.runPromise(
      creditLedgerRepository.getOrInitializeForLearner(learnerId)
    );
    expect(ledger.subscriptionCredits).toBe(5);
  });
});
