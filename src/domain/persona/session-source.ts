import type { IdealCustomerProfile } from "./ideal-customer-profile";
import type { IdealCustomerProfileRepository } from "./ideal-customer-profile-repository";

export type BroadPracticePoolSessionSource = {
  kind: "broad-practice-pool";
  label: string;
};

export type ActiveIdealCustomerProfileSessionSource = {
  kind: "active-ideal-customer-profile";
  idealCustomerProfile: Pick<
    IdealCustomerProfile,
    "id" | "name" | "customerDescription" | "notes"
  >;
};

export type SessionSource =
  | BroadPracticePoolSessionSource
  | ActiveIdealCustomerProfileSessionSource;

export async function resolveNextSessionSource(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "getActiveForLearner">
): Promise<SessionSource> {
  const activeProfile = await repository.getActiveForLearner(learnerId);

  if (!activeProfile) {
    return {
      kind: "broad-practice-pool",
      label: "Broad Practice Pool"
    };
  }

  return {
    kind: "active-ideal-customer-profile",
    idealCustomerProfile: toSessionSourceSnapshot(activeProfile)
  };
}

function toSessionSourceSnapshot(
  profile: IdealCustomerProfile
): ActiveIdealCustomerProfileSessionSource["idealCustomerProfile"] {
  return {
    id: profile.id,
    name: profile.name,
    customerDescription: profile.customerDescription,
    notes: profile.notes
  };
}
