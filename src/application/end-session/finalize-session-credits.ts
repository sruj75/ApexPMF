import {
  computeSessionCharge,
  computeVoiceFailureAdjustment,
  type SessionChargeResult,
  type SessionCreditContext
} from "@/src/domain/credits/credit-ledger";
import type {
  CreditLedgerRepository,
  CreditLedgerRepositoryError
} from "@/src/domain/credits/credit-ledger-repository";
import type { SessionEndReason } from "@/src/domain/session/session-lifecycle";
import { Effect } from "effect";

export function finalizeSessionCredits(input: {
  learnerId: string;
  sessionCreditContext: SessionCreditContext;
  reason: SessionEndReason;
  actualDurationMinutes: number;
  usableDurationMinutes: number;
  creditLedgerRepository: CreditLedgerRepository;
}): Effect.Effect<SessionChargeResult, CreditLedgerRepositoryError> {
  const { sessionCreditContext, reason, creditLedgerRepository, learnerId } = input;

  if (sessionCreditContext.kind === "free-trial") {
    return Effect.succeed({ kind: "free-trial", creditsCharged: 0 } as const);
  }

  if (sessionCreditContext.kind === "insufficient-credits") {
    return Effect.succeed({ kind: "not-charged", reason: "voice-failure" } as const);
  }

  const billed = computeSessionCharge({
    sessionCreditContext,
    actualDurationMinutes: input.actualDurationMinutes
  });

  if (!billed) {
    return Effect.succeed({ kind: "not-charged", reason: "voice-failure" } as const);
  }

  if (reason === "voice-failure") {
    return finalizeVoiceFailure({
      learnerId,
      billed,
      usableDurationMinutes: input.usableDurationMinutes,
      creditLedgerRepository
    });
  }

  const creditsToCharge = Math.min(
    billed.creditsCharged,
    sessionCreditContext.availableCredits
  );
  const cappedBilled = { ...billed, creditsCharged: creditsToCharge };

  return Effect.gen(function* () {
    if (creditsToCharge > 0) {
      yield* creditLedgerRepository.applyCharge(learnerId, creditsToCharge);
    }
    return { kind: "charged", billed: cappedBilled } as const;
  });
}

function finalizeVoiceFailure(input: {
  learnerId: string;
  billed: { actualDurationMinutes: number; billedDurationMinutes: number; creditsCharged: number };
  usableDurationMinutes: number;
  creditLedgerRepository: CreditLedgerRepository;
}): Effect.Effect<SessionChargeResult, CreditLedgerRepositoryError> {
  const adjustment = computeVoiceFailureAdjustment({
    billed: input.billed,
    usableDurationMinutes: input.usableDurationMinutes
  });

  return Effect.gen(function* () {
    if (adjustment.kind === "charged") {
      yield* input.creditLedgerRepository.applyCharge(
        input.learnerId,
        adjustment.billed.creditsCharged
      );
    } else if (adjustment.kind === "refunded") {
      const chargeAmount = adjustment.originalCharge - adjustment.refundedCredits;
      if (chargeAmount > 0) {
        yield* input.creditLedgerRepository.applyCharge(input.learnerId, chargeAmount);
      }
    }
    return adjustment;
  });
}
