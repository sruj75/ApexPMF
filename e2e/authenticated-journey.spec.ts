import { expect, test } from "@playwright/test";

const runAuthenticated =
  process.env.E2E_RUN_AUTHENTICATED === "1" || process.env.E2E_RUN_AUTHENTICATED === "true";

test.describe("authenticated journey (local / staging only)", () => {
  test.skip(!runAuthenticated, "Set E2E_RUN_AUTHENTICATED=1 with a saved storage state");

  test.use({
    storageState: process.env.E2E_STORAGE_STATE ?? "e2e/.auth/user.json"
  });

  test("dashboard → practice start → report surface", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /practice dashboard/i })).toBeVisible();

    await page.getByRole("button", { name: /start practice/i }).click();
    await page.waitForURL(/\/practice\/[^/]+$/);

    const sessionUrl = page.url();
    const sessionId = sessionUrl.split("/").pop();
    expect(sessionId).toBeTruthy();

    await page.goto(`/practice/${sessionId}/report`);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
