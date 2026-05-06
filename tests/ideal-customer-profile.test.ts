import { describe, expect, it } from "vitest";
import {
  parseIdealCustomerProfileInput
} from "../src/domain/persona/ideal-customer-profile";
import {
  createInMemoryIdealCustomerProfileRepository,
  type IdealCustomerProfileRepository
} from "../src/domain/persona/ideal-customer-profile-repository";
import { makeIdealCustomerProfile } from "./fixtures/ideal-customer-profile";

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

  it("keeps Active flags for other learners when selecting a profile", async () => {
    const repository = createInMemoryIdealCustomerProfileRepository([
      makeIdealCustomerProfile({
        id: "profile-10",
        learnerId: "learner-1",
        isActive: true
      }),
      makeIdealCustomerProfile({
        id: "profile-20",
        learnerId: "learner-2",
        isActive: true
      })
    ]);

    const created = await repository.create("learner-1", {
      name: "Logistics operators",
      customerDescription: "Ops leads at mid-sized distributors",
      notes: null
    });
    await repository.selectActive("learner-1", created.id);

    const learnerOneActive = await repository.getActiveForLearner("learner-1");
    const learnerTwoActive = await repository.getActiveForLearner("learner-2");

    expect(learnerOneActive?.id).toBe(created.id);
    expect(learnerTwoActive?.id).toBe("profile-20");
  });

  it("continues ID sequencing from the highest existing profile ID", async () => {
    const repository = createInMemoryIdealCustomerProfileRepository([
      makeIdealCustomerProfile({ id: "profile-100" })
    ]);

    const created = await repository.create(learnerId, {
      name: "Finance directors",
      customerDescription: "Directors running forecasting and close",
      notes: null
    });

    expect(created.id).toBe("profile-101");
  });
});
