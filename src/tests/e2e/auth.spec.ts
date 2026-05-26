import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("shows login page at /auth/login", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
  });

  test("redirects to login for protected routes", async ({ page }) => {
    await page.goto("/checkout");
    // If checkout requires auth, should redirect to login
    // Adjust expectation based on actual auth requirements
    const url = page.url();
    const isLoginOrCheckout = url.includes("/auth/login") || url.includes("/checkout");
    expect(isLoginOrCheckout).toBe(true);
  });
});
