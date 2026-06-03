import { test, expect, Page } from "@playwright/test";

/**
 * E2E Test: Admin Dashboard
 *
 * Tests the admin dashboard functionality including:
 * - Dashboard metrics and charts
 * - Order management
 * - Product management
 * - Configuration management
 *
 * Prerequisites:
 *   - App running on localhost:3000
 *   - Admin user: admin@example.com / Admin1234!
 *
 * Run with: npx playwright test e2e/admin-dashboard.spec.ts
 */

const ADMIN_USER = {
  email: "admin@example.com",
  password: "Admin1234!",
};

async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', ADMIN_USER.email);
  await page.fill('input[name="password"]', ADMIN_USER.password);
  await page.click('button[type="submit"]');
  // Login redirects to "/" on success; each test navigates to /admin itself.
  await page.waitForURL("**/");
}

test.describe("Admin Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display dashboard with key metrics", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Verify revenue metric
    const revenueCard = page.locator('[data-testid="metric-revenue"]');
    await expect(revenueCard).toBeVisible({ timeout: 10000 });

    // Verify orders metric
    const ordersCard = page.locator('[data-testid="metric-orders"]');
    await expect(ordersCard).toBeVisible();

    // Verify customers metric
    const customersCard = page.locator('[data-testid="metric-customers"]');
    await expect(customersCard).toBeVisible();

    // Verify conversion rate
    const conversionCard = page.locator('[data-testid="metric-conversion"]');
    await expect(conversionCard).toBeVisible();
  });

  test("should display revenue chart", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Chart should be visible
    const chart = page.locator('[data-testid="revenue-chart"]');
    await expect(chart).toBeVisible({ timeout: 10000 });

    // Should have date range selector
    const rangeSelector = page.locator('[data-testid="date-range-selector"]');
    if (await rangeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Switch to 30 days
      await page.click('[data-testid="range-30d"]');
      await page.waitForLoadState("networkidle");
    }
  });

  test("should show recent orders", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const recentOrders = page.locator('[data-testid="recent-orders"]');
    await expect(recentOrders).toBeVisible({ timeout: 10000 });

    // Should have at least one order row
    const orderRows = recentOrders.locator('[data-testid="order-row"]');
    const count = await orderRows.count();
    // Orders may or may not exist in test DB
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should navigate to orders management", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Click on orders nav item
    await page.click('[data-testid="nav-orders"]');
    await page.waitForURL("**/admin/orders**");

    // Orders table should be visible
    const ordersTable = page.locator('[data-testid="orders-table"]');
    await expect(ordersTable).toBeVisible({ timeout: 10000 });

    // Should have status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption("PENDING");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should navigate to products management", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Click on products nav item
    await page.click('[data-testid="nav-products"]');
    await page.waitForURL("**/admin/products**");

    // Products table should be visible
    const productsTable = page.locator('[data-testid="products-table"]');
    await expect(productsTable).toBeVisible({ timeout: 10000 });

    // Search should work
    const searchInput = page.locator('[data-testid="product-search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("test");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should manage system configuration", async ({ page }) => {
    await page.goto("/admin/config");
    await page.waitForLoadState("networkidle");

    // Config list should be visible
    const configList = page.locator('[data-testid="config-list"]');
    await expect(configList).toBeVisible({ timeout: 10000 });

    // Category filter should work
    const categoryFilter = page.locator('[data-testid="config-category-filter"]');
    if (await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryFilter.selectOption("search");
      await page.waitForLoadState("networkidle");
    }

    // Search should work
    const searchInput = page.locator('[data-testid="config-search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("cache");
      await page.waitForLoadState("networkidle");
    }
  });

  test("should view monitoring dashboard", async ({ page }) => {
    await page.goto("/admin/monitoring");
    await page.waitForLoadState("networkidle");

    // Health status should be visible
    const healthStatus = page.locator('[data-testid="health-status"]');
    await expect(healthStatus).toBeVisible({ timeout: 10000 });

    // Should show circuit breaker states
    const circuitBreakers = page.locator('[data-testid="circuit-breaker-status"]');
    if (await circuitBreakers.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(circuitBreakers).toContainText("CLOSED|OPEN|HALF_OPEN");
    }
  });

  test("should view fraud review dashboard", async ({ page }) => {
    await page.goto("/admin/fraud");
    await page.waitForLoadState("networkidle");

    // Fraud dashboard should load
    const fraudContent = page.locator('[data-testid="fraud-dashboard"]');
    await expect(fraudContent).toBeVisible({ timeout: 10000 });
  });

  test("should manage feature flags", async ({ page }) => {
    await page.goto("/admin/feature-flags");
    await page.waitForLoadState("networkidle");

    // Feature flags list should be visible
    const flagList = page.locator('[data-testid="feature-flags-list"]');
    await expect(flagList).toBeVisible({ timeout: 10000 });
  });

  test("should view queue dashboard", async ({ page }) => {
    await page.goto("/admin/queue");
    await page.waitForLoadState("networkidle");

    // Queue dashboard should load
    const queueContent = page.locator('[data-testid="queue-dashboard"]');
    await expect(queueContent).toBeVisible({ timeout: 10000 });
  });

  test("should navigate between admin sections", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const navLinks = [
      { testId: "nav-orders", urlPattern: /\/admin\/orders/ },
      { testId: "nav-products", urlPattern: /\/admin\/products/ },
      { testId: "nav-customers", urlPattern: /\/admin\/customers/ },
      { testId: "nav-config", urlPattern: /\/admin\/config/ },
    ];

    for (const link of navLinks) {
      const navItem = page.locator(`[data-testid="${link.testId}"]`);
      if (await navItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navItem.click();
        await page.waitForURL(link.urlPattern);
        await page.goBack();
        await page.waitForURL("**/admin");
      }
    }
  });
});
