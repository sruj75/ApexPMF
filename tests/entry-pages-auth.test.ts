import { beforeEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import ProfilePage from "../app/profile/page";
import PracticeSessionPage from "../app/practice/[sessionId]/page";

const {
  redirect,
  notFound,
  getProfilePageData,
  getLearnerEntryContext,
  getLearnerSessionRuntime,
  getLearnerEntryContextEffect,
  getLearnerSessionRuntimeEffect
} = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getProfilePageData: vi.fn(),
  getLearnerEntryContext: vi.fn(),
  getLearnerSessionRuntime: vi.fn(),
  getLearnerEntryContextEffect: vi.fn(),
  getLearnerSessionRuntimeEffect: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound
}));

vi.mock("@/src/application/start-session/practice-entry-web-adapter", () => ({
  getProfilePageData,
  getLearnerEntryContext,
  getLearnerSessionRuntime
}));

vi.mock("@/src/application/start-session/practice-entry-seam", () => ({
  getLearnerEntryContextEffect,
  getLearnerSessionRuntimeEffect
}));

describe("Entry pages auth guard parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfilePageData.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });
    getLearnerSessionRuntime.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });
    getLearnerEntryContextEffect.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );
    getLearnerSessionRuntimeEffect.mockReturnValue(
      Effect.succeed({
        ok: false,
        reason: "unauthenticated"
      })
    );
  });

  it("redirects Profile Settings to /login when unauthenticated", async () => {
    await expect(
      ProfilePage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects practice session page to /login when unauthenticated", async () => {
    await expect(
      PracticeSessionPage({
        params: Promise.resolve({
          sessionId: "11111111-1111-4111-8111-111111111111"
        })
      })
    ).rejects.toThrow("REDIRECT:/login");
  });
});
