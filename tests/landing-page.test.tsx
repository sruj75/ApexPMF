import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Landing Page", () => {
  it("communicates the practice promise with the Working Product Name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /the mom test simulator/i })
    ).toBeVisible();
    expect(
      screen.getByText(/sharpen your skill to talk to your customers/i)
    ).toBeVisible();
  });

  it("keeps The Mom Test relationship honest", () => {
    render(<Home />);

    expect(screen.getAllByText(/not affiliated/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/official mom test product/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/licensed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/endorsed/i)).not.toBeInTheDocument();
  });

  it("offers the expected public navigation actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("navigation", { name: /landing navigation/i })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(
      screen.getByRole("link", { name: /get started for free/i })
    ).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
      "href",
      "#features"
    );
  });

  it("explains the feature loop visitors are buying into", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /practice the interview/i })
    ).toBeVisible();
    expect(screen.getByText(/voice conversation/i)).toBeVisible();
    expect(
      screen.getAllByText(/fresh customer personas/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/session report/i).length).toBeGreaterThan(0);
  });

  it("shows the placeholder pricing model", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /pricing/i })).toBeVisible();
    expect(screen.getByText(/free trial session/i)).toBeVisible();
    expect(screen.getByText(/\$9\/month/i)).toBeVisible();
    expect(screen.getByText(/top-ups/i)).toBeVisible();
  });
});
