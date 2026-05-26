import { test, expect } from "@playwright/test";

test.describe("Product Browsing", () => {
  test("loads home page successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ShopEase/);
  });

  test("shows featured products on home page", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h2:has-text('Featured Products')");
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("shows category navigation", async ({ page }) => {
    await page.goto("/");
    const categories = page.locator('[class*="CategoryNav"], [class*="category"]');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });
});
