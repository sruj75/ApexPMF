import { render, screen } from "@testing-library/react";
import { ProgressionPathCard } from "../app/dashboard/progression-path-card";
import { GlobalRankingCard } from "../app/dashboard/global-ranking-card";
import type { DashboardProgressionView } from "../src/application/dashboard/progression-dashboard-presenter";

function makeFreshProgressionView(): DashboardProgressionView {
  return {
    completedSessionCount: 0,
    progressionScore: 0,
    achievementPath: [
      { id: "first-session", label: "First Session", unlocked: false }
    ],
    globalRanking: {
      kind: "insufficient-data",
      completedSessions: 0,
      requiredSessions: 3,
      label: "Insufficient Data"
    }
  };
}

describe("Practice Dashboard", () => {
  it("renders progression path with locked first-session for fresh learner", () => {
    const progression = makeFreshProgressionView();
    render(<ProgressionPathCard progression={progression} />);

    expect(
      screen.getByRole("heading", { name: /progression/i })
    ).toBeVisible();
    expect(
      screen.getByRole("listitem", { name: /first session: locked/i })
    ).toBeVisible();
    expect(
      screen.getByText(/complete a session to begin/i)
    ).toBeVisible();
  });

  it("renders global ranking with insufficient data state", () => {
    const progression = makeFreshProgressionView();
    render(<GlobalRankingCard progression={progression} />);

    expect(
      screen.getByRole("heading", { name: /global ranking/i })
    ).toBeVisible();
    expect(screen.getByText(/insufficient data/i)).toBeVisible();
    expect(screen.getByText(/0 of 3 sessions needed/i)).toBeVisible();
  });

  it("does not show lesson-style or fake ranking surfaces", () => {
    const progression = makeFreshProgressionView();
    render(
      <>
        <ProgressionPathCard progression={progression} />
        <GlobalRankingCard progression={progression} />
      </>
    );

    expect(screen.queryByText(/lesson-style/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/task list/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/training module/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/calendar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checklist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/top \d+%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/percentile/i)).not.toBeInTheDocument();
  });
});
