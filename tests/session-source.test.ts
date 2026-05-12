import { describe, expect, it } from "vitest";
import { makeIdealCustomerProfile } from "./fixtures/ideal-customer-profile";
import { createInMemoryIdealCustomerProfileRepository } from "../src/domain/persona/ideal-customer-profile-repository";
import {
  createBroadPracticePoolSessionSource,
  presentSessionSource,
  resolveNextSessionSource
} from "../src/domain/persona/session-source";
import { Effect } from "effect";

describe("Session source", () => {
  it("defaults Broad Practice Pool label in the domain constructor when label is missing or invalid", () => {
    expect(createBroadPracticePoolSessionSource()).toEqual({
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    });
    expect(
      createBroadPracticePoolSessionSource({
        label: 123
      })
    ).toEqual({
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    });
  });

  it("uses the Broad Practice Pool when no Active Ideal Customer Profile exists", async () => {
    const source = await Effect.runPromise(
      resolveNextSessionSource(
        "learner-1",
        createInMemoryIdealCustomerProfileRepository()
      )
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

    const source = await Effect.runPromise(
      resolveNextSessionSource("learner-1", repository)
    );
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

  it("presents Session Source policy for Active Ideal Customer Profile and Broad Practice Pool", async () => {
    const activeSource = await Effect.runPromise(
      resolveNextSessionSource(
        "learner-1",
        createInMemoryIdealCustomerProfileRepository([
          makeIdealCustomerProfile({
            id: "profile-99",
            isActive: true,
            name: "Clinical operators",
            customerDescription: "Practice managers in small clinics"
          })
        ])
      )
    );
    const broadSource = createBroadPracticePoolSessionSource();

    expect(presentSessionSource(activeSource)).toEqual({
      label: "Clinical operators",
      title: "Clinical operators",
      description: "Practice managers in small clinics"
    });
    expect(presentSessionSource(broadSource)).toEqual({
      label: "Broad Practice Pool",
      title: "Broad Practice Pool",
      description: "No Active Ideal Customer Profile is selected."
    });
  });
});
