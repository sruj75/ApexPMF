import { describe, expect, it } from "vitest";
import {
  resolveSessionCreditContext,
  roundToBlock,
  computeSessionCharge,
  checkCreditExhaustion,
  computeVoiceFailureAdjustment,
  type CreditLedger
} from "../src/domain/credits/credit-ledger";
import { createInMemoryCreditLedgerRepository } from "../src/domain/credits/credit-ledger-repository";
import { Effect } from "effect";

const learnerId = "learner-1";

function makeCreditLedger(
  overrides?: Partial<CreditLedger>
): CreditLedger {
  return {
    learnerId,
    freeTrialUsed: false,
    subscriptionCredits: 0,
    topUpCredits: 0,
    ...overrides
  };
}

describe("Credit Ledger — resolveSessionCreditContext", () => {
  it("returns free-trial for a new Learner who has not used their Free Trial Session", () => {
    const ledger = makeCreditLedger({ freeTrialUsed: false });

    const context = resolveSessionCreditContext(ledger);

    expect(context).toEqual({
      kind: "free-trial",
      maxDurationMinutes: 15
    });
  });

  it("returns paid context for a post-trial Learner with Credits", () => {
    const ledger = makeCreditLedger({
      freeTrialUsed: true,
      subscriptionCredits: 5,
      topUpCredits: 0
    });

    const context = resolveSessionCreditContext(ledger);

    expect(context).toEqual({
      kind: "paid",
      estimatedCredits: 3,
      availableCredits: 5
    });
  });

  it("returns insufficient-credits for a post-trial Learner with zero Credits", () => {
    const ledger = makeCreditLedger({
      freeTrialUsed: true,
      subscriptionCredits: 0,
      topUpCredits: 0
    });

    const context = resolveSessionCreditContext(ledger);

    expect(context).toEqual({
      kind: "insufficient-credits",
      availableCredits: 0,
      minimumRequired: 1
    });
  });
});

describe("Credit Ledger — roundToBlock", () => {
  it("rounds duration up to 5-minute blocks", () => {
    expect(roundToBlock(0)).toBe(0);
    expect(roundToBlock(1)).toBe(5);
    expect(roundToBlock(5)).toBe(5);
    expect(roundToBlock(7)).toBe(10);
    expect(roundToBlock(15)).toBe(15);
    expect(roundToBlock(16)).toBe(20);
  });
});

describe("Credit Ledger — computeSessionCharge", () => {
  it("charges rounded duration in Credits for a paid Session", () => {
    const result = computeSessionCharge({
      sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 5 },
      actualDurationMinutes: 7
    });

    expect(result).toEqual({
      actualDurationMinutes: 7,
      billedDurationMinutes: 10,
      creditsCharged: 2
    });
  });

  it("returns null for a Free Trial Session", () => {
    const result = computeSessionCharge({
      sessionCreditContext: { kind: "free-trial", maxDurationMinutes: 15 },
      actualDurationMinutes: 12
    });

    expect(result).toBeNull();
  });
});

describe("Credit Ledger — checkCreditExhaustion", () => {
  it("reports not exhausted when elapsed time is within credit budget", () => {
    const result = checkCreditExhaustion({
      sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 3 },
      elapsedMinutes: 7
    });

    expect(result).toEqual({ exhausted: false, remainingMinutes: 8 });
  });

  it("reports exhausted when elapsed time exceeds credit budget", () => {
    const result = checkCreditExhaustion({
      sessionCreditContext: { kind: "paid", estimatedCredits: 3, availableCredits: 2 },
      elapsedMinutes: 11
    });

    expect(result).toEqual({ exhausted: true });
  });
});

describe("Credit Ledger — computeVoiceFailureAdjustment", () => {
  it("refunds unused blocks when failure happens mid-session", () => {
    const billed = {
      actualDurationMinutes: 12,
      billedDurationMinutes: 15,
      creditsCharged: 3
    };

    const result = computeVoiceFailureAdjustment({
      billed,
      usableDurationMinutes: 8
    });

    expect(result).toEqual({
      kind: "refunded",
      originalCharge: 3,
      refundedCredits: 1,
      reason: "voice-failure"
    });
  });

  it("does not charge when voice failure happens at minute zero", () => {
    const billed = {
      actualDurationMinutes: 0,
      billedDurationMinutes: 0,
      creditsCharged: 0
    };

    const result = computeVoiceFailureAdjustment({
      billed,
      usableDurationMinutes: 0
    });

    expect(result).toEqual({
      kind: "not-charged",
      reason: "voice-failure"
    });
  });
});

describe("Credit Ledger Repository (in-memory)", () => {
  it("initializes a default ledger for a new Learner", async () => {
    const repository = createInMemoryCreditLedgerRepository();

    const ledger = await Effect.runPromise(
      repository.getOrInitializeForLearner(learnerId)
    );

    expect(ledger).toEqual({
      learnerId,
      freeTrialUsed: false,
      subscriptionCredits: 0,
      topUpCredits: 0
    });
  });

  it("marks Free Trial as used", async () => {
    const repository = createInMemoryCreditLedgerRepository();
    await Effect.runPromise(repository.getOrInitializeForLearner(learnerId));

    const updated = await Effect.runPromise(
      repository.markFreeTrialUsed(learnerId)
    );

    expect(updated.freeTrialUsed).toBe(true);
  });

  it("deducts from Subscription Credits first when charging", async () => {
    const repository = createInMemoryCreditLedgerRepository([
      makeCreditLedger({ subscriptionCredits: 3, topUpCredits: 5, freeTrialUsed: true })
    ]);

    const updated = await Effect.runPromise(
      repository.applyCharge(learnerId, 2)
    );

    expect(updated.subscriptionCredits).toBe(1);
    expect(updated.topUpCredits).toBe(5);
  });

  it("overflows charge to top-up Credits when Subscription Credits are insufficient", async () => {
    const repository = createInMemoryCreditLedgerRepository([
      makeCreditLedger({ subscriptionCredits: 1, topUpCredits: 5, freeTrialUsed: true })
    ]);

    const updated = await Effect.runPromise(
      repository.applyCharge(learnerId, 3)
    );

    expect(updated.subscriptionCredits).toBe(0);
    expect(updated.topUpCredits).toBe(3);
  });

  it("adds refunded Credits to top-up pool", async () => {
    const repository = createInMemoryCreditLedgerRepository([
      makeCreditLedger({ subscriptionCredits: 0, topUpCredits: 2, freeTrialUsed: true })
    ]);

    const updated = await Effect.runPromise(
      repository.applyRefund(learnerId, 2)
    );

    expect(updated.topUpCredits).toBe(4);
  });
});
