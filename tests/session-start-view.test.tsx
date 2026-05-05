import { render, screen } from "@testing-library/react";
import { SessionStartView } from "../app/practice/[sessionId]/session-start-view";

describe("Session start view", () => {
  it("shows Opening Context without exposing the hidden Generated Session Case", () => {
    render(
      <SessionStartView
        startedSession={{
          sessionId: "session-case-1",
          openingContext:
            "You are speaking with a controller who recently tried to reduce month-end reporting delays.",
          sessionSourceLabel: "Finance operators",
          lightPersonaLabel: "SaaS controller"
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: /voice conversation/i })
    ).toBeVisible();
    expect(screen.getByText(/reduce month-end reporting delays/i)).toBeVisible();
    expect(screen.getByText(/finance operators/i)).toBeVisible();
    expect(screen.getByText(/saas controller/i)).toBeVisible();
    expect(screen.getByText(/session timer/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /end session/i })).toBeVisible();

    // Ensure internal AI-generated session mechanics never appear in learner-facing UI.
    expect(screen.queryByText(/hidden backstory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/customer fit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hidden test plan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/progression/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/global ranking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hint/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/coaching/i)).not.toBeInTheDocument();
  });
});
