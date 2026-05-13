import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

const {
  createSupabaseServerClientEffect,
  createSupabaseAdminClientEffect,
  createSupabaseIdealCustomerProfileRepository,
  createSupabaseGeneratedSessionCaseRepository,
  createSupabaseCreditLedgerRepository
} = vi.hoisted(() => ({
  createSupabaseServerClientEffect: vi.fn(),
  createSupabaseAdminClientEffect: vi.fn(),
  createSupabaseIdealCustomerProfileRepository: vi.fn(),
  createSupabaseGeneratedSessionCaseRepository: vi.fn(),
  createSupabaseCreditLedgerRepository: vi.fn()
}));

vi.mock("@/src/infrastructure/supabase/server", () => ({
  createSupabaseServerClientEffect,
  createSupabaseAdminClientEffect
}));

vi.mock("@/src/infrastructure/supabase/ideal-customer-profiles", () => ({
  createSupabaseIdealCustomerProfileRepository
}));

vi.mock("@/src/infrastructure/supabase/generated-session-cases", () => ({
  createSupabaseGeneratedSessionCaseRepository
}));

vi.mock("@/src/infrastructure/supabase/credit-ledgers", () => ({
  createSupabaseCreditLedgerRepository
}));

import { getSupabaseLearnerEntryContextEffect } from "../src/infrastructure/supabase/learner-entry-context";

describe("Supabase learner entry context", () => {
  it("wires the persistent Credit Ledger repository for authenticated Learners", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "learner-1" } },
          error: null
        }))
      }
    };
    const creditLedgerRepository = { kind: "supabase-credit-ledger" };
    const creditSupabase = { kind: "admin-supabase" };

    createSupabaseServerClientEffect.mockReturnValue(Effect.succeed(supabase));
    createSupabaseAdminClientEffect.mockReturnValue(Effect.succeed(creditSupabase));
    createSupabaseIdealCustomerProfileRepository.mockReturnValue({
      kind: "profile-repository"
    });
    createSupabaseGeneratedSessionCaseRepository.mockReturnValue({
      kind: "session-case-repository"
    });
    createSupabaseCreditLedgerRepository.mockReturnValue(creditLedgerRepository);

    const result = await Effect.runPromise(getSupabaseLearnerEntryContextEffect());

    expect(result).toMatchObject({
      ok: true,
      learnerId: "learner-1",
      creditLedgerRepository
    });
    expect(createSupabaseCreditLedgerRepository).toHaveBeenCalledWith(creditSupabase);
  });
});
