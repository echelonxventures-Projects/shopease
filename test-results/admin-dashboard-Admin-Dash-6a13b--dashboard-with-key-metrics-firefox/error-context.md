# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin Dashboard E2E >> should display dashboard with key metrics
- Location: src/tests/e2e/admin-dashboard.spec.ts:38:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - link "ShopEase Admin" [ref=e5] [cursor=pointer]:
        - /url: /admin/dashboard
      - navigation [ref=e6]:
        - link "📊 Dashboard" [ref=e7] [cursor=pointer]:
          - /url: /admin/dashboard
          - generic [ref=e8]: 📊
          - generic [ref=e9]: Dashboard
        - button "📦 Catalog ▸" [ref=e11]:
          - generic [ref=e12]: 📦
          - generic [ref=e13]: Catalog
          - generic [ref=e14]: ▸
        - button "🛒 Orders & Fulfillment ▸" [ref=e16]:
          - generic [ref=e17]: 🛒
          - generic [ref=e18]: Orders & Fulfillment
          - generic [ref=e19]: ▸
        - button "👥 Customers ▸" [ref=e21]:
          - generic [ref=e22]: 👥
          - generic [ref=e23]: Customers
          - generic [ref=e24]: ▸
        - button "🏭 Suppliers & Procurement ▸" [ref=e26]:
          - generic [ref=e27]: 🏭
          - generic [ref=e28]: Suppliers & Procurement
          - generic [ref=e29]: ▸
        - button "🏪 Marketplace ▸" [ref=e31]:
          - generic [ref=e32]: 🏪
          - generic [ref=e33]: Marketplace
          - generic [ref=e34]: ▸
        - button "🎉 Promotions & Loyalty ▸" [ref=e36]:
          - generic [ref=e37]: 🎉
          - generic [ref=e38]: Promotions & Loyalty
          - generic [ref=e39]: ▸
        - button "💳 Payments & Finance ▸" [ref=e41]:
          - generic [ref=e42]: 💳
          - generic [ref=e43]: Payments & Finance
          - generic [ref=e44]: ▸
        - button "🖼️ Content & CMS ▸" [ref=e46]:
          - generic [ref=e47]: 🖼️
          - generic [ref=e48]: Content & CMS
          - generic [ref=e49]: ▸
        - button "🌍 Regions ▸" [ref=e51]:
          - generic [ref=e52]: 🌍
          - generic [ref=e53]: Regions
          - generic [ref=e54]: ▸
        - button "🌐 Sites ▸" [ref=e56]:
          - generic [ref=e57]: 🌐
          - generic [ref=e58]: Sites
          - generic [ref=e59]: ▸
        - button "🧩 Platforms ▸" [ref=e61]:
          - generic [ref=e62]: 🧩
          - generic [ref=e63]: Platforms
          - generic [ref=e64]: ▸
        - link "➕ Create New Platform" [ref=e65] [cursor=pointer]:
          - /url: /admin/platforms
          - generic [ref=e66]: ➕
          - generic [ref=e67]: Create New Platform
        - button "💰 Reselling & Revenue ▸" [ref=e69]:
          - generic [ref=e70]: 💰
          - generic [ref=e71]: Reselling & Revenue
          - generic [ref=e72]: ▸
        - button "📈 Analytics & Reports ▸" [ref=e74]:
          - generic [ref=e75]: 📈
          - generic [ref=e76]: Analytics & Reports
          - generic [ref=e77]: ▸
        - button "⚙️ Settings & System ▸" [ref=e79]:
          - generic [ref=e80]: ⚙️
          - generic [ref=e81]: Settings & System
          - generic [ref=e82]: ▸
        - link "🏠 Back to Store" [ref=e84] [cursor=pointer]:
          - /url: /
          - generic [ref=e85]: 🏠
          - generic [ref=e86]: Back to Store
    - generic [ref=e87]:
      - banner [ref=e88]:
        - generic [ref=e89]:
          - heading "Admin Dashboard" [level=2] [ref=e90]
          - generic [ref=e91]:
            - generic [ref=e93]: A
            - button "Logout" [ref=e94]:
              - img
              - text: Logout
      - main [ref=e95]:
        - img [ref=e97]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e104] [cursor=pointer]:
    - generic [ref=e107]:
      - text: Rendering
      - generic [ref=e108]:
        - generic [ref=e109]: .
        - generic [ref=e110]: .
        - generic [ref=e111]: .
  - alert [ref=e112]
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * E2E Test: Admin Dashboard
  5   |  *
  6   |  * Tests the admin dashboard functionality including:
  7   |  * - Dashboard metrics and charts
  8   |  * - Order management
  9   |  * - Product management
  10  |  * - Configuration management
  11  |  *
  12  |  * Prerequisites:
  13  |  *   - App running on localhost:3000
  14  |  *   - Admin user: admin@example.com / Admin1234!
  15  |  *
  16  |  * Run with: npx playwright test e2e/admin-dashboard.spec.ts
  17  |  */
  18  | 
  19  | const ADMIN_USER = {
  20  |   email: "admin@example.com",
  21  |   password: "Admin1234!",
  22  | };
  23  | 
  24  | async function loginAsAdmin(page: Page) {
  25  |   await page.goto("/auth/login");
  26  |   await page.fill('input[name="email"]', ADMIN_USER.email);
  27  |   await page.fill('input[name="password"]', ADMIN_USER.password);
  28  |   await page.click('button[type="submit"]');
  29  |   // Login redirects to "/" on success; each test navigates to /admin itself.
  30  |   await page.waitForURL("**/");
  31  | }
  32  | 
  33  | test.describe("Admin Dashboard E2E", () => {
  34  |   test.beforeEach(async ({ page }) => {
  35  |     await loginAsAdmin(page);
  36  |   });
  37  | 
  38  |   test("should display dashboard with key metrics", async ({ page }) => {
  39  |     await page.goto("/admin");
> 40  |     await page.waitForLoadState("networkidle");
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  41  | 
  42  |     // Verify revenue metric
  43  |     const revenueCard = page.locator('[data-testid="metric-revenue"]');
  44  |     await expect(revenueCard).toBeVisible({ timeout: 10000 });
  45  | 
  46  |     // Verify orders metric
  47  |     const ordersCard = page.locator('[data-testid="metric-orders"]');
  48  |     await expect(ordersCard).toBeVisible();
  49  | 
  50  |     // Verify customers metric
  51  |     const customersCard = page.locator('[data-testid="metric-customers"]');
  52  |     await expect(customersCard).toBeVisible();
  53  | 
  54  |     // Verify conversion rate
  55  |     const conversionCard = page.locator('[data-testid="metric-conversion"]');
  56  |     await expect(conversionCard).toBeVisible();
  57  |   });
  58  | 
  59  |   test("should display revenue chart", async ({ page }) => {
  60  |     await page.goto("/admin");
  61  |     await page.waitForLoadState("networkidle");
  62  | 
  63  |     // Chart should be visible
  64  |     const chart = page.locator('[data-testid="revenue-chart"]');
  65  |     await expect(chart).toBeVisible({ timeout: 10000 });
  66  | 
  67  |     // Should have date range selector
  68  |     const rangeSelector = page.locator('[data-testid="date-range-selector"]');
  69  |     if (await rangeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
  70  |       // Switch to 30 days
  71  |       await page.click('[data-testid="range-30d"]');
  72  |       await page.waitForLoadState("networkidle");
  73  |     }
  74  |   });
  75  | 
  76  |   test("should show recent orders", async ({ page }) => {
  77  |     await page.goto("/admin");
  78  |     await page.waitForLoadState("networkidle");
  79  | 
  80  |     const recentOrders = page.locator('[data-testid="recent-orders"]');
  81  |     await expect(recentOrders).toBeVisible({ timeout: 10000 });
  82  | 
  83  |     // Should have at least one order row
  84  |     const orderRows = recentOrders.locator('[data-testid="order-row"]');
  85  |     const count = await orderRows.count();
  86  |     // Orders may or may not exist in test DB
  87  |     expect(count).toBeGreaterThanOrEqual(0);
  88  |   });
  89  | 
  90  |   test("should navigate to orders management", async ({ page }) => {
  91  |     await page.goto("/admin");
  92  |     await page.waitForLoadState("networkidle");
  93  | 
  94  |     // Click on orders nav item
  95  |     await page.click('[data-testid="nav-orders"]');
  96  |     await page.waitForURL("**/admin/orders**");
  97  | 
  98  |     // Orders table should be visible
  99  |     const ordersTable = page.locator('[data-testid="orders-table"]');
  100 |     await expect(ordersTable).toBeVisible({ timeout: 10000 });
  101 | 
  102 |     // Should have status filter
  103 |     const statusFilter = page.locator('[data-testid="status-filter"]');
  104 |     if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
  105 |       await statusFilter.selectOption("PENDING");
  106 |       await page.waitForLoadState("networkidle");
  107 |     }
  108 |   });
  109 | 
  110 |   test("should navigate to products management", async ({ page }) => {
  111 |     await page.goto("/admin");
  112 |     await page.waitForLoadState("networkidle");
  113 | 
  114 |     // Click on products nav item
  115 |     await page.click('[data-testid="nav-products"]');
  116 |     await page.waitForURL("**/admin/products**");
  117 | 
  118 |     // Products table should be visible
  119 |     const productsTable = page.locator('[data-testid="products-table"]');
  120 |     await expect(productsTable).toBeVisible({ timeout: 10000 });
  121 | 
  122 |     // Search should work
  123 |     const searchInput = page.locator('[data-testid="product-search"]');
  124 |     if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  125 |       await searchInput.fill("test");
  126 |       await page.waitForLoadState("networkidle");
  127 |     }
  128 |   });
  129 | 
  130 |   test("should manage system configuration", async ({ page }) => {
  131 |     await page.goto("/admin/config");
  132 |     await page.waitForLoadState("networkidle");
  133 | 
  134 |     // Config list should be visible
  135 |     const configList = page.locator('[data-testid="config-list"]');
  136 |     await expect(configList).toBeVisible({ timeout: 10000 });
  137 | 
  138 |     // Category filter should work
  139 |     const categoryFilter = page.locator('[data-testid="config-category-filter"]');
  140 |     if (await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
```