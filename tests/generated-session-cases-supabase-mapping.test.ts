import { describe, expect, it, vi } from "vitest";
import { createSupabaseGeneratedSessionCaseRepository } from "../src/infrastructure/supabase/generated-session-cases";
import { SupabaseRowDecodeError } from "../src/infrastructure/supabase/supabase-row-decode-error";

describe("Generated Session Case Supabase mapping", () => {
  it("preserves broad-practice-pool label from source_snapshot on readback", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        source_kind: "broad-practice-pool",
        source_profile_id: null,
        source_snapshot: {
          label: "Custom Broad Pool Label"
        }
      }
    });

    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.sessionSource).toEqual({
      kind: "broad-practice-pool",
      label: "Custom Broad Pool Label"
    });
  });

  it("falls back to default broad-practice-pool label when source_snapshot label is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        source_kind: "broad-practice-pool",
        source_profile_id: null,
        source_snapshot: {
          label: 123
        }
      }
    });

    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.sessionSource).toEqual({
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    });
  });

  it("throws typed decode errors when nested JSON shape is invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        traps: "not-an-array"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toMatchObject({
      name: "SupabaseRowDecodeError",
      adapter: "generated_session_cases",
      operation: "getForLearner"
    });
  });

  it("throws typed decode errors when required row fields are invalid", async () => {
    const repository = createRepositoryForGetForLearner({
      data: {
        ...validGeneratedSessionCaseRow,
        created_at: "not-a-date"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toBeInstanceOf(SupabaseRowDecodeError);
  });

  it("still throws Supabase query errors as plain Error", async () => {
    const repository = createRepositoryForGetForLearner({
      data: null,
      error: {
        message: "database is unavailable"
      }
    });

    await expect(
      repository.getForLearner(
        "learner-1",
        "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
      )
    ).rejects.toThrow("database is unavailable");
  });
});

function createRepositoryForGetForLearner(input: {
  data: unknown;
  error?: { message: string } | null;
}) {
  const maybeSingle = vi.fn(async () => ({
    data: input.data,
    error: input.error ?? null
  }));

  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    maybeSingle
  };

  const supabase = {
    from: vi.fn(() => queryBuilder)
  };

  return createSupabaseGeneratedSessionCaseRepository(supabase as never);
}

const validGeneratedSessionCaseRow = {
  id: "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec",
  learner_id: "learner-1",
  source_kind: "active-ideal-customer-profile",
  source_profile_id: "profile-1",
  source_snapshot: {
    id: "profile-1",
    name: "Finance operators",
    customerDescription: "Controllers at growth SaaS companies",
    notes: null
  },
  opening_context: "Opening context",
  light_persona_label: "Finance operator",
  customer_persona: {
    lightPersonaLabel: "Finance operator",
    interviewRole: "Controller",
    publicContext: "Owns reporting",
    privateConstraints: ["Budget owner is VP Finance"]
  },
  hidden_backstory: "Hidden backstory",
  customer_fit: "strong-fit",
  hidden_test_plan: {
    focusAreas: ["Concrete History"],
    successSignals: ["Asked about recent attempts"],
    failureSignals: ["Pitched before diagnosis"]
  },
  traps: [
    {
      id: "trap-1",
      label: "Compliment Trap",
      setup: "Persona praises the pitch.",
      weakBehavior: "Learner accepts praise as validation."
    }
  ],
  generation_nonce: "nonce-1",
  generation_audit: {
    provider: "test",
    model: "test-model"
  },
  created_at: "2026-05-05T00:00:00.000Z"
};
