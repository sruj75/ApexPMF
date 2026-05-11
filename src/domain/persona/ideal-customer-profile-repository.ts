import type {
  IdealCustomerProfile,
  IdealCustomerProfileInput
} from "./ideal-customer-profile";
import { Data, Effect } from "effect";

export type IdealCustomerProfileRepositoryOperation =
  | "listForLearner"
  | "getActiveForLearner"
  | "create"
  | "update"
  | "selectActive"
  | "clearActive";

export class IdealCustomerProfileRepositoryPersistenceError extends Data.TaggedError(
  "IdealCustomerProfileRepositoryPersistenceError"
)<{
  operation: IdealCustomerProfileRepositoryOperation;
  cause: unknown;
}> {}

export class IdealCustomerProfileRepositoryDecodeError extends Data.TaggedError(
  "IdealCustomerProfileRepositoryDecodeError"
)<{
  operation: IdealCustomerProfileRepositoryOperation;
  cause: unknown;
}> {}

export class IdealCustomerProfileRepositoryNotFoundError extends Data.TaggedError(
  "IdealCustomerProfileRepositoryNotFoundError"
)<{
  learnerId: string;
  profileId: string;
  operation: "update" | "selectActive";
}> {}

export type IdealCustomerProfileRepositoryError =
  | IdealCustomerProfileRepositoryPersistenceError
  | IdealCustomerProfileRepositoryDecodeError
  | IdealCustomerProfileRepositoryNotFoundError;

export type IdealCustomerProfileRepository = {
  listForLearner(
    learnerId: string
  ): Effect.Effect<IdealCustomerProfile[], IdealCustomerProfileRepositoryError, never>;
  getActiveForLearner(
    learnerId: string
  ): Effect.Effect<
    IdealCustomerProfile | null,
    IdealCustomerProfileRepositoryError,
    never
  >;
  create(
    learnerId: string,
    input: IdealCustomerProfileInput
  ): Effect.Effect<IdealCustomerProfile, IdealCustomerProfileRepositoryError, never>;
  update(
    learnerId: string,
    profileId: string,
    input: IdealCustomerProfileInput
  ): Effect.Effect<IdealCustomerProfile, IdealCustomerProfileRepositoryError, never>;
  selectActive(
    learnerId: string,
    profileId: string
  ): Effect.Effect<void, IdealCustomerProfileRepositoryError, never>;
  clearActive(
    learnerId: string
  ): Effect.Effect<void, IdealCustomerProfileRepositoryError, never>;
};

export function createInMemoryIdealCustomerProfileRepository(
  initialProfiles: IdealCustomerProfile[] = []
): IdealCustomerProfileRepository {
  let profiles = [...initialProfiles];
  let nextId = profiles.reduce((max, profile) => {
    const match = /^profile-(\d+)$/.exec(profile.id);
    return match ? Math.max(max, Number.parseInt(match[1] ?? "0", 10) + 1) : max;
  }, 1);

  return {
    listForLearner(learnerId) {
      return Effect.succeed(
        profiles
          .filter((profile) => profile.learnerId === learnerId)
          .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      );
    },

    getActiveForLearner(learnerId) {
      return Effect.succeed(
        profiles.find(
          (profile) => profile.learnerId === learnerId && profile.isActive
        ) ?? null
      );
    },

    create(learnerId, input) {
      return Effect.sync(() => {
        const now = new Date();
        const profile: IdealCustomerProfile = {
          id: `profile-${nextId}`,
          learnerId,
          name: input.name,
          customerDescription: input.customerDescription,
          notes: input.notes,
          isActive: false,
          createdAt: now,
          updatedAt: now
        };

        nextId += 1;
        profiles = [...profiles, profile];
        return profile;
      });
    },

    update(learnerId, profileId, input) {
      return Effect.gen(function* () {
        let updatedProfile: IdealCustomerProfile | null = null;

        profiles = profiles.map((profile) => {
          if (profile.learnerId !== learnerId || profile.id !== profileId) {
            return profile;
          }

          updatedProfile = {
            ...profile,
            name: input.name,
            customerDescription: input.customerDescription,
            notes: input.notes,
            updatedAt: new Date()
          };
          return updatedProfile;
        });

        if (!updatedProfile) {
          return yield* Effect.fail(
            new IdealCustomerProfileRepositoryNotFoundError({
              learnerId,
              profileId,
              operation: "update"
            })
          );
        }

        return updatedProfile;
      });
    },

    selectActive(learnerId, profileId) {
      return Effect.gen(function* () {
        const exists = profiles.some(
          (profile) => profile.learnerId === learnerId && profile.id === profileId
        );

        if (!exists) {
          return yield* Effect.fail(
            new IdealCustomerProfileRepositoryNotFoundError({
              learnerId,
              profileId,
              operation: "selectActive"
            })
          );
        }

        profiles = profiles.map((profile) =>
          profile.learnerId === learnerId
            ? {
                ...profile,
                isActive: profile.id === profileId
              }
            : profile
        );
      });
    },

    clearActive(learnerId) {
      return Effect.sync(() => {
        profiles = profiles.map((profile) =>
          profile.learnerId === learnerId
            ? {
                ...profile,
                isActive: false
              }
            : profile
        );
      });
    }
  };
}
