import type { IdealCustomerProfile } from "@/src/domain/persona/ideal-customer-profile";

const learnerId = "learner-1";

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
