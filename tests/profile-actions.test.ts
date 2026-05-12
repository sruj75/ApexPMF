import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearActiveIdealCustomerProfileAction,
  createIdealCustomerProfileAction
} from "../app/profile/actions";

const {
  redirect,
  revalidatePath,
  getLearnerEntryContext,
  createIdealCustomerProfileForLearner,
  clearActiveIdealCustomerProfileForLearner
} = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  revalidatePath: vi.fn(),
  getLearnerEntryContext: vi.fn(),
  createIdealCustomerProfileForLearner: vi.fn(),
  clearActiveIdealCustomerProfileForLearner: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("@/src/application/start-session/practice-entry-web-adapter", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/src/application/start-session/practice-entry-web-adapter")
  >();
  return {
    ...actual,
    getLearnerEntryContext,
    createIdealCustomerProfileForLearner,
    clearActiveIdealCustomerProfileForLearner
  };
});

describe("Profile Settings actions", () => {
  const repository = {};

  beforeEach(() => {
    vi.clearAllMocks();
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1",
      idealCustomerProfileRepository: repository,
      generatedSessionCaseRepository: {}
    });
    createIdealCustomerProfileForLearner.mockResolvedValue(undefined);
    clearActiveIdealCustomerProfileForLearner.mockResolvedValue(undefined);
  });

  it("creates an Ideal Customer Profile and revalidates /profile", async () => {
    const formData = new FormData();
    formData.set("name", "  Finance operators ");
    formData.set(
      "customerDescription",
      " Controllers at growing SaaS companies "
    );
    formData.set("notes", " Probe budget owner workarounds ");

    await expect(createIdealCustomerProfileAction(formData)).resolves.toBe(
      undefined
    );
    expect(createIdealCustomerProfileForLearner).toHaveBeenCalledWith(
      "learner-1",
      repository,
      {
        name: "Finance operators",
        customerDescription: "Controllers at growing SaaS companies",
        notes: "Probe budget owner workarounds"
      }
    );
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("preserves redirectWithError behavior for invalid input", async () => {
    const formData = new FormData();
    formData.set("name", " ");
    formData.set("customerDescription", "Any value");
    formData.set("notes", "");

    await expect(createIdealCustomerProfileAction(formData)).rejects.toThrow(
      "REDIRECT:/profile?error=Name+is+required."
    );
    expect(createIdealCustomerProfileForLearner).not.toHaveBeenCalled();
  });

  it("clears active profile and revalidates /profile", async () => {
    await expect(
      clearActiveIdealCustomerProfileAction(new FormData())
    ).resolves.toBeUndefined();

    expect(clearActiveIdealCustomerProfileForLearner).toHaveBeenCalledWith(
      "learner-1",
      repository
    );
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("redirects unauthenticated Learners to /login", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(
      clearActiveIdealCustomerProfileAction(new FormData())
    ).rejects.toThrow("REDIRECT:/login");
    expect(clearActiveIdealCustomerProfileForLearner).not.toHaveBeenCalled();
  });
});
