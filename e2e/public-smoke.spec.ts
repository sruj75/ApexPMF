import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("landing page shows product brand and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ApexPMF");
    await expect(page.getByRole("link", { name: /get started for free/i })).toBeVisible();
  });

  test("login offers Google-only auth", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /continue with google/i })).toHaveAttribute(
      "href",
      "/auth/start?next=/dashboard"
    );
  });

  test("signup offers Google-only auth", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /start for free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /continue with google/i })).toHaveAttribute(
      "href",
      "/auth/start?next=/dashboard"
    );
  });

  test("dashboard redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("practice redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/practice");
    await expect(page).toHaveURL(/\/login$/);
  });
});
