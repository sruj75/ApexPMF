import { render, screen } from "@testing-library/react";
import DashboardPage from "../app/dashboard/page";

describe("Practice Dashboard", () => {
  it("starts the core practice loop from an honest dashboard shell", () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole("heading", { name: /practice dashboard/i })
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: /start practice/i })).toHaveLength(
      2
    );
    expect(
      screen.getByRole("navigation", { name: /dashboard navigation/i })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /progression/i })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /global ranking/i })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /broad practice pool/i })
    ).toBeVisible();
    expect(screen.getByText(/insufficient data state/i)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /recent session reports/i })
    ).toBeVisible();
  });

  it("does not show lesson-style or fake ranking surfaces", () => {
    render(<DashboardPage />);

    expect(screen.queryByText(/lesson-style/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/task list/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/training module/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/calendar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checklist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next practice focus/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/top \d+%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/percentile/i)).not.toBeInTheDocument();
  });

  it("renders an empty recent Session Reports state without seeded reports", () => {
    render(<DashboardPage />);

    expect(screen.getByText(/no session reports yet/i)).toBeVisible();
    expect(screen.queryByText(/missed signals/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bad questions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/strong questions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trap results/i)).not.toBeInTheDocument();
  });
});
