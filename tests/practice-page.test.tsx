import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PracticePage from "../app/practice/page";

describe("Practice page", () => {
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
