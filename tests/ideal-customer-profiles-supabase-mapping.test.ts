import { describe, expect, it, vi } from "vitest";
import { createSupabaseIdealCustomerProfileRepository } from "../src/infrastructure/supabase/ideal-customer-profiles";
import { SupabaseRowDecodeError } from "../src/infrastructure/supabase/supabase-row-decode-error";

describe("Ideal Customer Profiles Supabase mapping", () => {
  it("decodes listForLearner rows into domain profiles", async () => {
    const repository = createRepository({
      listData: [validProfileRow, { ...validProfileRow, id: "profile-2" }]
    });

    const profiles = await repository.listForLearner("learner-1");

    expect(profiles).toHaveLength(2);
    expect(profiles[0]).toMatchObject({
      id: "profile-1",
      learnerId: "learner-1",
      name: "Finance operators",
      customerDescription: "Controllers at growth SaaS companies",
      notes: null,
      isActive: true
    });
    expect(profiles[0].createdAt).toBeInstanceOf(Date);
    expect(profiles[0].updatedAt).toBeInstanceOf(Date);
  });

  it("returns null for getActiveForLearner when maybeSingle returns null", async () => {
    const repository = createRepository({
      activeData: null
    });

    const profile = await repository.getActiveForLearner("learner-1");

    expect(profile).toBeNull();
  });

  it("decodes create and update rows into domain profiles", async () => {
    const repository = createRepository({
      createData: validProfileRow,
      updateData: {
        ...validProfileRow,
        name: "Updated profile"
      }
    });

    const created = await repository.create("learner-1", {
      name: "Finance operators",
      customerDescription: "Controllers at growth SaaS companies",
      notes: null
    });
    const updated = await repository.update("learner-1", "profile-1", {
      name: "Updated profile",
      customerDescription: "Controllers at growth SaaS companies",
      notes: null
    });

    expect(created.name).toBe("Finance operators");
    expect(updated.name).toBe("Updated profile");
  });

  it("throws typed decode error with rowIndex for listForLearner decode failures", async () => {
    const repository = createRepository({
      listData: [
        validProfileRow,
        {
          ...validProfileRow,
          updated_at: "invalid-date"
        }
      ]
    });

    await expect(repository.listForLearner("learner-1")).rejects.toMatchObject({
      name: "SupabaseRowDecodeError",
      adapter: "ideal_customer_profiles",
      operation: "listForLearner",
      rowIndex: 1
    });
  });

  it("throws typed decode error for getActiveForLearner on invalid row shapes", async () => {
    const repository = createRepository({
      activeData: {
        ...validProfileRow,
        notes: 123
      }
    });

    await expect(repository.getActiveForLearner("learner-1")).rejects.toBeInstanceOf(
      SupabaseRowDecodeError
    );
  });

  it("still throws Supabase query errors as plain Error", async () => {
    const repository = createRepository({
      createError: {
        message: "insert failed"
      }
    });

    await expect(
      repository.create("learner-1", {
        name: "Finance operators",
        customerDescription: "Controllers at growth SaaS companies",
        notes: null
      })
    ).rejects.toThrow("insert failed");
  });
});

function createRepository(input: {
  listData?: unknown[];
  activeData?: unknown | null;
  createData?: unknown;
  updateData?: unknown;
  listError?: { message: string } | null;
  activeError?: { message: string } | null;
  createError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const activeBuilder = {
    eq: vi.fn(() => activeBuilder),
    maybeSingle: vi.fn(async () => ({
      data:
        input.activeData === undefined ? validProfileRow : input.activeData,
      error: input.activeError ?? null
    }))
  };

  const createUpdateBuilder = {
    eq: vi.fn(() => createUpdateBuilder),
    select: vi.fn(() => createUpdateBuilder),
    single: vi.fn(async () => ({
      data: input.updateData ?? validProfileRow,
      error: input.updateError ?? null
    }))
  };

  const queryBuilder = {
    select: vi.fn(() => selectBuilder),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: input.createData ?? validProfileRow,
          error: input.createError ?? null
        }))
      }))
    })),
    update: vi.fn(() => createUpdateBuilder)
  };

  const selectBuilder = {
    eq: vi.fn((column: string) => {
      if (column === "is_active") {
        return activeBuilder;
      }

      return selectBuilder;
    }),
    order: vi.fn(async () => ({
      data: input.listData ?? [],
      error: input.listError ?? null
    })),
    maybeSingle: vi.fn(async () => ({
      data:
        input.activeData === undefined ? validProfileRow : input.activeData,
      error: input.activeError ?? null
    }))
  };

  const supabase = {
    from: vi.fn(() => queryBuilder),
    rpc: vi.fn(async () => ({ error: null }))
  };

  return createSupabaseIdealCustomerProfileRepository(supabase as never);
}

const validProfileRow = {
  id: "profile-1",
  learner_id: "learner-1",
  name: "Finance operators",
  customer_description: "Controllers at growth SaaS companies",
  notes: null,
  is_active: true,
  created_at: "2026-05-05T00:00:00.000Z",
  updated_at: "2026-05-06T00:00:00.000Z"
};
