import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";

const { getSupabaseLearnerEntryContextEffect } = vi.hoisted(() => ({
  getSupabaseLearnerEntryContextEffect: vi.fn()
}));

vi.mock("@/src/infrastructure/supabase/learner-entry-context", () => ({
  getSupabaseLearnerEntryContextEffect
}));

import {
  getProfilePageData,
  createIdealCustomerProfileForLearner,
  clearActiveIdealCustomerProfileForLearner,
  parseProfileInput
} from "../src/application/start-session/practice-entry-web-adapter";

describe("Profile page seam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthenticated when Learner is not signed in", async () => {
    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );

    const result = await getProfilePageData();
    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated"
    });
  });

  it("returns profiles, presented session source, and clear-active flag for authenticated Learner", async () => {
    const activeProfile = {
      id: "profile-1",
      learnerId: "learner-1",
      name: "Finance operators",
      customerDescription: "Controllers at growing SaaS",
      notes: "Budget focus",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const repository = {
      listForLearner: vi.fn(() => Effect.succeed([activeProfile])),
      getActiveForLearner: vi.fn(() => Effect.succeed(activeProfile)),
      create: vi.fn(),
      update: vi.fn(),
      selectActive: vi.fn(),
      clearActive: vi.fn()
    };

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: repository,
        generatedSessionCaseRepository: {}
      })
    );

    const result = await getProfilePageData();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    expect(result.profiles).toEqual([activeProfile]);
    expect(result.presentedSessionSource).toEqual({
      label: "Finance operators",
      title: "Finance operators",
      description: "Controllers at growing SaaS"
    });
    expect(result.canClearActiveSource).toBe(true);
  });

  it("re-exports parseIdealCustomerProfileInput as parseProfileInput", () => {
    const result = parseProfileInput({
      name: "  Finance ops ",
      customerDescription: " Controllers ",
      notes: ""
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Finance ops");
    }
  });

  it("creates an Ideal Customer Profile through the application seam", async () => {
    const repository = {
      listForLearner: vi.fn(() => Effect.succeed([])),
      getActiveForLearner: vi.fn(() => Effect.succeed(null)),
      create: vi.fn(() => Effect.void),
      update: vi.fn(),
      selectActive: vi.fn(),
      clearActive: vi.fn()
    };

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: repository,
        generatedSessionCaseRepository: {}
      })
    );

    const pageData = await getProfilePageData();
    if (!pageData.ok) throw new Error("expected ok");

    await createIdealCustomerProfileForLearner(
      pageData.learnerId,
      pageData.idealCustomerProfileRepository,
      { name: "Ops", customerDescription: "Controllers", notes: null }
    );

    expect(repository.create).toHaveBeenCalledWith("learner-1", {
      name: "Ops",
      customerDescription: "Controllers",
      notes: null
    });
  });

  it("clears active profile through the application seam", async () => {
    const repository = {
      listForLearner: vi.fn(() => Effect.succeed([])),
      getActiveForLearner: vi.fn(() => Effect.succeed(null)),
      create: vi.fn(),
      update: vi.fn(),
      selectActive: vi.fn(),
      clearActive: vi.fn(() => Effect.void)
    };

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-1",
        idealCustomerProfileRepository: repository,
        generatedSessionCaseRepository: {}
      })
    );

    const pageData = await getProfilePageData();
    if (!pageData.ok) throw new Error("expected ok");

    await clearActiveIdealCustomerProfileForLearner(
      pageData.learnerId,
      pageData.idealCustomerProfileRepository
    );

    expect(repository.clearActive).toHaveBeenCalledWith("learner-1");
  });

  it("returns broad practice pool when no active profile exists", async () => {
    const repository = {
      listForLearner: vi.fn(() => Effect.succeed([])),
      getActiveForLearner: vi.fn(() => Effect.succeed(null)),
      create: vi.fn(),
      update: vi.fn(),
      selectActive: vi.fn(),
      clearActive: vi.fn()
    };

    getSupabaseLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: true,
        learnerId: "learner-2",
        idealCustomerProfileRepository: repository,
        generatedSessionCaseRepository: {}
      })
    );

    const result = await getProfilePageData();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    expect(result.profiles).toEqual([]);
    expect(result.presentedSessionSource.title).toBe("Broad Practice Pool");
    expect(result.canClearActiveSource).toBe(false);
  });
});
