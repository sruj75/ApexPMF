import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createSupabaseCreditLedgerRepository } from "../src/infrastructure/supabase/credit-ledgers";

describe("Supabase Credit Ledger repository", () => {
  it("uses privileged RPC functions for initialization and mutations", async () => {
    const rpc = vi.fn(async (name: string) => ({
      data: {
        learner_id: "learner-1",
        free_trial_used: name === "mark_credit_ledger_free_trial_used",
        subscription_credits: name === "apply_credit_ledger_charge" ? 3 : 5,
        top_up_credits: name === "apply_credit_ledger_refund" ? 2 : 0
      },
      error: null
    }));
    const supabase = {
      rpc,
      from: vi.fn(() => {
        throw new Error("Credit ledger mutations should not use table writes.");
      })
    };
    const repository = createSupabaseCreditLedgerRepository(supabase as never);

    await Effect.runPromise(repository.getOrInitializeForLearner("learner-1"));
    await Effect.runPromise(repository.markFreeTrialUsed("learner-1"));
    await Effect.runPromise(repository.applyCharge("learner-1", 2));
    await Effect.runPromise(repository.applyRefund("learner-1", 2));

    expect(rpc.mock.calls).toEqual([
      ["ensure_credit_ledger", { p_learner_id: "learner-1" }],
      ["mark_credit_ledger_free_trial_used", { p_learner_id: "learner-1" }],
      [
        "apply_credit_ledger_charge",
        { p_learner_id: "learner-1", p_credits: 2 }
      ],
      [
        "apply_credit_ledger_refund",
        { p_learner_id: "learner-1", p_credits: 2 }
      ]
    ]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
