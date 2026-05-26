import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PracticePage from "../app/practice/page";

const { redirect, getLearnerEntryContext } = vi.hoisted(() => ({
  redirect: vi.fn((location: string) => {
    throw new Error(`REDIRECT:${location}`);
  }),
  getLearnerEntryContext: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect
}));

vi.mock("@/src/application/start-session/practice-entry-web-adapter", () => ({
  getLearnerEntryContext
}));

describe("Practice page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLearnerEntryContext.mockResolvedValue({
      ok: true,
      learnerId: "learner-1"
    });
  });

  it("redirects to /login when unauthenticated", async () => {
    getLearnerEntryContext.mockResolvedValue({
      ok: false,
      reason: "unauthenticated"
    });

    await expect(PracticePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login"
    );
  });

  it("renders a friendly Session creation error state", async () => {
    render(
      await PracticePage({
        searchParams: Promise.resolve({
          error: "session_creation_failed"
        })
      })
    );

    expect(
      screen.getByRole("heading", { name: /practice unavailable right now/i })
    ).toBeVisible();
    expect(
      screen.getByText(/we could not start your session\. please try again\./i)
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /return to practice dashboard/i })
    ).toHaveAttribute("href", "/dashboard");
  });

  it("renders non-error Start Practice state when no error query is present", async () => {
    render(await PracticePage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /^start practice$/i })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /start practice/i })).toBeVisible();
  });
});
