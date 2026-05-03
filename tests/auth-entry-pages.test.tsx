import { render, screen } from "@testing-library/react";
import LoginPage from "../app/login/page";
import SignupPage from "../app/signup/page";

describe("Auth entry pages", () => {
  it("offers Google-only login", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /log in/i })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /continue with google/i })
    ).toHaveAttribute("href", "/auth/start?next=/dashboard");
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("offers Google-only sign up", () => {
    render(<SignupPage />);

    expect(screen.getByRole("heading", { name: /start for free/i })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /continue with google/i })
    ).toHaveAttribute("href", "/auth/start?next=/dashboard");
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });
});
