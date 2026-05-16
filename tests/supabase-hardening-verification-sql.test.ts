import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const verificationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/verification/20260513000400_harden_credits_and_progressions.sql"
  ),
  "utf-8"
);

describe("Supabase credits and progression production verification SQL", () => {
  it("asserts wrapper placement, private implementations, and the tightened Progression grant posture", () => {
    expect(verificationSql).toContain("public.ensure_credit_ledger");
    expect(verificationSql).toContain("private.ensure_credit_ledger");
    expect(verificationSql).toContain("prosecdef");
    expect(verificationSql).toContain("has_function_privilege('service_role'");
    expect(verificationSql).toContain("has_function_privilege('authenticated'");
    expect(verificationSql).toContain("learner_progressions");
    expect(verificationSql).toContain("'SELECT'");
    expect(verificationSql).toContain("'INSERT'");
    expect(verificationSql).toContain("'UPDATE'");
  });
});
