import type {
  IdealCustomerProfile,
  IdealCustomerProfileInput
} from "./ideal-customer-profile";

export type IdealCustomerProfileRepository = {
  listForLearner(learnerId: string): Promise<IdealCustomerProfile[]>;
  getActiveForLearner(learnerId: string): Promise<IdealCustomerProfile | null>;
  create(
    learnerId: string,
    input: IdealCustomerProfileInput
  ): Promise<IdealCustomerProfile>;
  update(
    learnerId: string,
    profileId: string,
    input: IdealCustomerProfileInput
  ): Promise<IdealCustomerProfile>;
  selectActive(learnerId: string, profileId: string): Promise<void>;
  clearActive(learnerId: string): Promise<void>;
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
    async listForLearner(learnerId) {
      return profiles
        .filter((profile) => profile.learnerId === learnerId)
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
    },

    async getActiveForLearner(learnerId) {
      return (
        profiles.find(
          (profile) => profile.learnerId === learnerId && profile.isActive
        ) ?? null
      );
    },

    async create(learnerId, input) {
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
    },

    async update(learnerId, profileId, input) {
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
        throw new Error("Ideal Customer Profile not found.");
      }

      return updatedProfile;
    },

    async selectActive(learnerId, profileId) {
      const exists = profiles.some(
        (profile) => profile.learnerId === learnerId && profile.id === profileId
      );

      if (!exists) {
        throw new Error("Ideal Customer Profile not found.");
      }

      profiles = profiles.map((profile) =>
        profile.learnerId === learnerId
          ? {
              ...profile,
              isActive: profile.id === profileId
            }
          : profile
      );
    },

    async clearActive(learnerId) {
      profiles = profiles.map((profile) =>
        profile.learnerId === learnerId
          ? {
              ...profile,
              isActive: false
            }
          : profile
      );
    }
  };
}
