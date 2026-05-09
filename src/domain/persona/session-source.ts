import type { IdealCustomerProfile } from "./ideal-customer-profile";
import type { IdealCustomerProfileRepository } from "./ideal-customer-profile-repository";
import { Data, Effect } from "effect";

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

export class SessionSourceResolutionError extends Data.TaggedError(
  "SessionSourceResolutionError"
)<{
  learnerId: string;
  cause: unknown;
}> {}

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

export function resolveNextSessionSource(
  learnerId: string,
  repository: Pick<IdealCustomerProfileRepository, "getActiveForLearner">
): Effect.Effect<SessionSource, SessionSourceResolutionError, never> {
  return Effect.tryPromise({
    try: () => repository.getActiveForLearner(learnerId),
    catch: (cause) =>
      new SessionSourceResolutionError({
        learnerId,
        cause
      })
  }).pipe(
    Effect.map((activeProfile) =>
      activeProfile
        ? {
            kind: "active-ideal-customer-profile" as const,
            idealCustomerProfile: toSessionSourceSnapshot(activeProfile)
          }
        : createBroadPracticePoolSessionSource()
    )
  );
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
