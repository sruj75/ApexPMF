import { describe, expect, it } from "vitest";
import {
  parseIdealCustomerProfileInput,
  type IdealCustomerProfile
} from "../src/domain/persona/ideal-customer-profile";
import {
  createInMemoryIdealCustomerProfileRepository,
  type IdealCustomerProfileRepository
} from "../src/domain/persona/ideal-customer-profile-repository";

const learnerId = "learner-1";

describe("Ideal Customer Profiles", () => {
  it("accepts minimal user-created Ideal Customer Profile input and trims display fields", () => {
    const parsed = parseIdealCustomerProfileInput({
      name: "  B2B finance operators  ",
      customerDescription: "  Controllers at growing SaaS companies  ",
      notes: "  Ask about month-end close workarounds.  "
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        name: "B2B finance operators",
        customerDescription: "Controllers at growing SaaS companies",
        notes: "Ask about month-end close workarounds."
      }
    });
  });

  it("rejects blank Ideal Customer Profile names and customer descriptions", () => {
    expect(
      parseIdealCustomerProfileInput({
        name: " ",
        customerDescription: "Founders",
        notes: ""
      })
    ).toEqual({
      ok: false,
      errors: ["Name is required."]
    });

    expect(
      parseIdealCustomerProfileInput({
        name: "Healthcare buyers",
        customerDescription: " ",
        notes: ""
      })
    ).toEqual({
      ok: false,
      errors: ["Customer description is required."]
    });
  });

  it("creates, edits, lists, and switches one Active Ideal Customer Profile", async () => {
    const repository = createInMemoryIdealCustomerProfileRepository();

    const first = await repository.create(learnerId, {
      name: "Finance teams",
      customerDescription: "Controllers at SaaS companies",
      notes: null
    });
    const second = await repository.create(learnerId, {
      name: "Clinical operators",
      customerDescription: "Practice managers in small clinics",
      notes: "Probe scheduling workarounds."
    });

    await repository.update(learnerId, first.id, {
      name: "Finance operators",
      customerDescription: "Controllers at growing SaaS companies",
      notes: null
    });
    await repository.selectActive(learnerId, first.id);
    await repository.selectActive(learnerId, second.id);

    const profiles = await repository.listForLearner(learnerId);

    expect(profiles).toHaveLength(2);
    expect(profiles.find((profile) => profile.id === first.id)).toMatchObject({
      name: "Finance operators",
      isActive: false
    });
    expect(profiles.find((profile) => profile.id === second.id)).toMatchObject({
      name: "Clinical operators",
      isActive: true
    });
  });

  it("clears the Active Ideal Customer Profile without deleting saved profiles", async () => {
    const repository: IdealCustomerProfileRepository =
      createInMemoryIdealCustomerProfileRepository();
    const profile = await repository.create(learnerId, {
      name: "Marketplace sellers",
      customerDescription: "Independent sellers on marketplaces",
      notes: null
    });

    await repository.selectActive(learnerId, profile.id);
    await repository.clearActive(learnerId);

    expect(await repository.getActiveForLearner(learnerId)).toBeNull();
    expect(await repository.listForLearner(learnerId)).toHaveLength(1);
  });
});

export function makeIdealCustomerProfile(
  overrides: Partial<IdealCustomerProfile> = {}
): IdealCustomerProfile {
  const now = new Date("2026-05-02T00:00:00.000Z");

  return {
    id: "profile-1",
    learnerId,
    name: "Finance operators",
    customerDescription: "Controllers at growing SaaS companies",
    notes: null,
    isActive: false,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
