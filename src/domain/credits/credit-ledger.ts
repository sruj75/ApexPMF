export const FREE_TRIAL_DURATION_CAP_MINUTES = 15;
export const CREDIT_BLOCK_SIZE_MINUTES = 5;
export const CREDITS_PER_BLOCK = 1;

export type CreditLedger = {
  learnerId: string;
  freeTrialUsed: boolean;
  subscriptionCredits: number;
  topUpCredits: number;
};

export type SessionCreditContext =
  | { kind: "free-trial"; maxDurationMinutes: 15 }
  | { kind: "paid"; estimatedCredits: number; availableCredits: number }
  | {
      kind: "insufficient-credits";
      availableCredits: number;
      minimumRequired: number;
    };

export function resolveSessionCreditContext(
  ledger: CreditLedger
): SessionCreditContext {
  if (!ledger.freeTrialUsed) {
    return { kind: "free-trial", maxDurationMinutes: FREE_TRIAL_DURATION_CAP_MINUTES as 15 };
  }

  const available = ledger.subscriptionCredits + ledger.topUpCredits;
  const minimumRequired = CREDITS_PER_BLOCK;

  if (available < minimumRequired) {
    return { kind: "insufficient-credits", availableCredits: available, minimumRequired };
  }

  const estimatedCredits = estimateSessionCredits();
  return { kind: "paid", estimatedCredits, availableCredits: available };
}

export type BilledDuration = {
  actualDurationMinutes: number;
  billedDurationMinutes: number;
  creditsCharged: number;
};

export function computeSessionCharge(input: {
  sessionCreditContext:
    | Extract<SessionCreditContext, { kind: "free-trial" }>
    | Extract<SessionCreditContext, { kind: "paid" }>;
  actualDurationMinutes: number;
}): BilledDuration | null {
  if (input.sessionCreditContext.kind === "free-trial") {
    return null;
  }

  const billedDurationMinutes = roundToBlock(input.actualDurationMinutes);
  const creditsCharged =
    (billedDurationMinutes / CREDIT_BLOCK_SIZE_MINUTES) * CREDITS_PER_BLOCK;

  return {
    actualDurationMinutes: input.actualDurationMinutes,
    billedDurationMinutes,
    creditsCharged
  };
}

export type SessionChargeResult =
  | { kind: "free-trial"; creditsCharged: 0 }
  | { kind: "charged"; billed: BilledDuration }
  | {
      kind: "refunded";
      originalCharge: number;
      refundedCredits: number;
      reason: "voice-failure";
    }
  | { kind: "not-charged"; reason: "voice-failure" };

export function computeVoiceFailureAdjustment(input: {
  billed: BilledDuration;
  usableDurationMinutes: number;
}): SessionChargeResult {
  const usableBilled = roundToBlock(input.usableDurationMinutes);
  const usableCredits =
    (usableBilled / CREDIT_BLOCK_SIZE_MINUTES) * CREDITS_PER_BLOCK;

  if (usableCredits <= 0) {
    return { kind: "not-charged", reason: "voice-failure" };
  }

  const refunded = input.billed.creditsCharged - usableCredits;

  if (refunded > 0) {
    return {
      kind: "refunded",
      originalCharge: input.billed.creditsCharged,
      refundedCredits: refunded,
      reason: "voice-failure"
    };
  }

  return { kind: "charged", billed: input.billed };
}

export type CreditExhaustionCheck =
  | { exhausted: false; remainingMinutes: number }
  | { exhausted: true };

export function checkCreditExhaustion(input: {
  sessionCreditContext: Extract<SessionCreditContext, { kind: "paid" }>;
  elapsedMinutes: number;
}): CreditExhaustionCheck {
  const maxMinutes =
    (input.sessionCreditContext.availableCredits / CREDITS_PER_BLOCK) *
    CREDIT_BLOCK_SIZE_MINUTES;
  const remaining = maxMinutes - input.elapsedMinutes;

  if (remaining <= 0) {
    return { exhausted: true };
  }

  return { exhausted: false, remainingMinutes: remaining };
}

export function roundToBlock(durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  return Math.ceil(durationMinutes / CREDIT_BLOCK_SIZE_MINUTES) * CREDIT_BLOCK_SIZE_MINUTES;
}

function estimateSessionCredits(): number {
  return Math.ceil(FREE_TRIAL_DURATION_CAP_MINUTES / CREDIT_BLOCK_SIZE_MINUTES) * CREDITS_PER_BLOCK;
}
