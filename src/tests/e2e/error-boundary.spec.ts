import { test, expect } from "@playwright/test";

test.describe("Error Pages", () => {
  test("shows 404 for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");
    await expect(page.locator("text=404")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Page not found")).toBeVisible();
  });

  test("provides home link on 404 page", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");
    const homeLink = page.locator("a:has-text('Go Home')");
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});
