import { describe, expect, it } from "vitest";
import { makeIdealCustomerProfile } from "./fixtures/ideal-customer-profile";
import { createInMemoryIdealCustomerProfileRepository } from "../src/domain/persona/ideal-customer-profile-repository";
import { resolveNextSessionSource } from "../src/domain/persona/session-source";

describe("Session source", () => {
  it("uses the Broad Practice Pool when no Active Ideal Customer Profile exists", async () => {
    const source = await resolveNextSessionSource(
      "learner-1",
      createInMemoryIdealCustomerProfileRepository()
    );

    expect(source).toEqual({
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    });
  });

  it("uses an immutable Active Ideal Customer Profile snapshot for future Sessions", async () => {
    const profile = makeIdealCustomerProfile({
      id: "profile-42",
      isActive: true,
      notes: "Probe budget owner workarounds."
    });
    const repository = createInMemoryIdealCustomerProfileRepository([
      profile
    ]);

    const source = await resolveNextSessionSource("learner-1", repository);
    profile.name = "Mutated name";
    profile.notes = "Mutated notes";

    expect(source).toEqual({
      kind: "active-ideal-customer-profile",
      idealCustomerProfile: {
        id: "profile-42",
        name: "Finance operators",
        customerDescription: "Controllers at growing SaaS companies",
        notes: "Probe budget owner workarounds."
      }
    });
  });
});
