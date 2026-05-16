import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260513000400_harden_credits_and_progressions.sql"
  ),
  "utf-8"
);

describe("Supabase credits and progression hardening migration", () => {
  it("moves privileged credit routines behind private implementations while preserving public RPC wrappers", () => {
    expect(migration).toContain("create schema if not exists private;");
    expect(migration).toContain("create or replace function private.ensure_credit_ledger");
    expect(migration).toContain("create or replace function private.claim_credit_ledger_free_trial");
    expect(migration).toContain("create or replace function private.mark_credit_ledger_free_trial_used");
    expect(migration).toContain("create or replace function private.apply_credit_ledger_charge");
    expect(migration).toContain("create or replace function private.apply_credit_ledger_refund");
    expect(migration).toContain("create or replace function public.ensure_credit_ledger");
    expect(migration).toContain("return private.claim_credit_ledger_free_trial(p_learner_id);");
    expect(migration).toContain("grant execute on function public.apply_credit_ledger_refund(uuid, integer) to service_role;");
    expect(migration).toContain("revoke all on function public.apply_credit_ledger_refund(uuid, integer) from anon, authenticated;");
  });

  it("tightens learner progression grants to the repository operations that remain supported", () => {
    expect(migration).toContain("revoke all on table public.learner_progressions from anon;");
    expect(migration).toContain("revoke all on table public.learner_progressions from authenticated;");
    expect(migration).toContain(
      "grant select, insert, update on table public.learner_progressions to authenticated;"
    );
    expect(migration).not.toContain(
      "grant delete, truncate, references, trigger on table public.learner_progressions to authenticated;"
    );
  });
});
