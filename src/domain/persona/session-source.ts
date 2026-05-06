import type { IdealCustomerProfile } from "./ideal-customer-profile";
import type { IdealCustomerProfileRepository } from "./ideal-customer-profile-repository";

const broadPracticePoolDefaultLabel = "Broad Practice Pool";

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

export type SessionSourcePresentation = {
  label: string;
  title: string;
  description: string;
};

export function createBroadPracticePoolSessionSource(input?: {
  label?: unknown;
}): BroadPracticePoolSessionSource {
  return {
    kind: "broad-practice-pool",
    label: normalizeBroadPracticePoolLabel(input?.label)
  };
}

export function presentSessionSource(
  sessionSource: SessionSource
): SessionSourcePresentation {
  switch (sessionSource.kind) {
    case "active-ideal-customer-profile":
      return {
        label: sessionSource.idealCustomerProfile.name,
        title: sessionSource.idealCustomerProfile.name,
        description: sessionSource.idealCustomerProfile.customerDescription
      };
    case "broad-practice-pool":
      return {
        label: sessionSource.label,
        title: sessionSource.label,
        description: "No Active Ideal Customer Profile is selected."
      };
    default:
      return assertNeverSessionSource(sessionSource);
  }
}

export async function resolveNextSessionSource(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "getActiveForLearner">
): Promise<SessionSource> {
  const activeProfile = await repository.getActiveForLearner(learnerId);

  if (!activeProfile) {
    return createBroadPracticePoolSessionSource();
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

function normalizeBroadPracticePoolLabel(label: unknown): string {
  return typeof label === "string" && label.trim().length > 0
    ? label
    : broadPracticePoolDefaultLabel;
}

function assertNeverSessionSource(sessionSource: never): never {
  throw new Error(`Unknown Session source kind: ${String(sessionSource)}`);
}
