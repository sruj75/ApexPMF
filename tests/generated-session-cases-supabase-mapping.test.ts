import { describe, expect, it, vi } from "vitest";
import { createSupabaseGeneratedSessionCaseRepository } from "../src/infrastructure/supabase/generated-session-cases";

describe("Generated Session Case Supabase mapping", () => {
  it("preserves broad-practice-pool label from source_snapshot on readback", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec",
        learner_id: "learner-1",
        source_kind: "broad-practice-pool",
        source_profile_id: null,
        source_snapshot: {
          label: "Custom Broad Pool Label"
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
      },
      error: null
    }));

    const queryBuilder = {
      select: vi.fn(() => queryBuilder),
      eq: vi.fn(() => queryBuilder),
      maybeSingle
    };

    const supabase = {
      from: vi.fn(() => queryBuilder)
    };

    const repository = createSupabaseGeneratedSessionCaseRepository(
      supabase as never
    );
    const sessionCase = await repository.getForLearner(
      "learner-1",
      "a0b6c66a-9f8a-4129-a4d8-9e5a9208ebec"
    );

    expect(sessionCase?.sessionSource).toEqual({
      kind: "broad-practice-pool",
      label: "Custom Broad Pool Label"
    });
  });
});
