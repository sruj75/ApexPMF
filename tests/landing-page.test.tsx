import { render, screen } from "@testing-library/react";
import Home from "../app/page";
import {
  PRODUCT_DESCRIPTION,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_TAGLINE
} from "../src/product/brand";

describe("Landing Page", () => {
  it("communicates the tagline, description, and display product name", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: PRODUCT_DISPLAY_NAME })
    ).toBeVisible();
    expect(screen.getByText(PRODUCT_TAGLINE)).toBeVisible();
    expect(screen.getByText(PRODUCT_DESCRIPTION)).toBeVisible();
  });

  it("does not claim official Mom Test product status", () => {
    render(<Home />);

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
      screen.getByRole("heading", { name: /meet fresh customer personas/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review your session report/i })
    ).toBeInTheDocument();
  });

  it("shows the placeholder pricing model", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /pricing/i })).toBeVisible();
    expect(screen.getByText(/free trial session/i)).toBeVisible();
    expect(screen.getByText(/\$9\/month/i)).toBeVisible();
    expect(screen.getByText(/top-ups/i)).toBeVisible();
  });
});
