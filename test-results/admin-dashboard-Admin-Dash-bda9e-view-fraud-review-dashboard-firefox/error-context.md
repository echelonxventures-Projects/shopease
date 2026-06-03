# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin Dashboard E2E >> should view fraud review dashboard
- Location: src/tests/e2e/admin-dashboard.spec.ts:168:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="fraud-dashboard"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="fraud-dashboard"]')

```

```yaml
- complementary:
  - link "ShopEase Admin":
    - /url: /admin/dashboard
  - navigation:
    - link "📊 Dashboard":
      - /url: /admin/dashboard
    - button "📦 Catalog ▸"
    - button "🛒 Orders & Fulfillment ▸"
    - button "👥 Customers ▸"
    - button "🏭 Suppliers & Procurement ▸"
    - button "🏪 Marketplace ▸"
    - button "🎉 Promotions & Loyalty ▸"
    - button "💳 Payments & Finance ▸"
    - button "🖼️ Content & CMS ▸"
    - button "🌍 Regions ▸"
    - button "🌐 Sites ▸"
    - button "🧩 Platforms ▸"
    - link "➕ Create New Platform":
      - /url: /admin/platforms
    - button "💰 Reselling & Revenue ▸"
    - button "📈 Analytics & Reports ▸"
    - button "⚙️ Settings & System ▸"
    - link "🏠 Back to Store":
      - /url: /
- banner:
  - heading "Admin Dashboard" [level=2]
  - text: A Admin
  - button "Logout"
- main:
  - heading "Fraud Detection" [level=1]
  - button "Review"
  - button "Rules"
  - paragraph: Total Pending
  - paragraph: "0"
  - paragraph: Reviewed
  - paragraph: "0"
  - paragraph: Blocked
  - paragraph: "0"
  - paragraph: Passed
  - paragraph: "0"
  - heading "Evaluate Order" [level=2]
  - textbox "Order ID"
  - button "Evaluate"
  - button "ALL"
  - button "PASS"
  - button "REVIEW"
  - button "BLOCK"
  - button
  - paragraph: No fraud scores to review
- region "Notifications alt+T"
- alert
```

# Test source

```ts
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
  141 |       await categoryFilter.selectOption("search");
  142 |       await page.waitForLoadState("networkidle");
  143 |     }
  144 | 
  145 |     // Search should work
  146 |     const searchInput = page.locator('[data-testid="config-search"]');
  147 |     if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  148 |       await searchInput.fill("cache");
  149 |       await page.waitForLoadState("networkidle");
  150 |     }
  151 |   });
  152 | 
  153 |   test("should view monitoring dashboard", async ({ page }) => {
  154 |     await page.goto("/admin/monitoring");
  155 |     await page.waitForLoadState("networkidle");
  156 | 
  157 |     // Health status should be visible
  158 |     const healthStatus = page.locator('[data-testid="health-status"]');
  159 |     await expect(healthStatus).toBeVisible({ timeout: 10000 });
  160 | 
  161 |     // Should show circuit breaker states
  162 |     const circuitBreakers = page.locator('[data-testid="circuit-breaker-status"]');
  163 |     if (await circuitBreakers.isVisible({ timeout: 5000 }).catch(() => false)) {
  164 |       await expect(circuitBreakers).toContainText("CLOSED|OPEN|HALF_OPEN");
  165 |     }
  166 |   });
  167 | 
  168 |   test("should view fraud review dashboard", async ({ page }) => {
  169 |     await page.goto("/admin/fraud");
  170 |     await page.waitForLoadState("networkidle");
  171 | 
  172 |     // Fraud dashboard should load
  173 |     const fraudContent = page.locator('[data-testid="fraud-dashboard"]');
> 174 |     await expect(fraudContent).toBeVisible({ timeout: 10000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  175 |   });
  176 | 
  177 |   test("should manage feature flags", async ({ page }) => {
  178 |     await page.goto("/admin/feature-flags");
  179 |     await page.waitForLoadState("networkidle");
  180 | 
  181 |     // Feature flags list should be visible
  182 |     const flagList = page.locator('[data-testid="feature-flags-list"]');
  183 |     await expect(flagList).toBeVisible({ timeout: 10000 });
  184 |   });
  185 | 
  186 |   test("should view queue dashboard", async ({ page }) => {
  187 |     await page.goto("/admin/queue");
  188 |     await page.waitForLoadState("networkidle");
  189 | 
  190 |     // Queue dashboard should load
  191 |     const queueContent = page.locator('[data-testid="queue-dashboard"]');
  192 |     await expect(queueContent).toBeVisible({ timeout: 10000 });
  193 |   });
  194 | 
  195 |   test("should navigate between admin sections", async ({ page }) => {
  196 |     await page.goto("/admin");
  197 |     await page.waitForLoadState("networkidle");
  198 | 
  199 |     const navLinks = [
  200 |       { testId: "nav-orders", urlPattern: /\/admin\/orders/ },
  201 |       { testId: "nav-products", urlPattern: /\/admin\/products/ },
  202 |       { testId: "nav-customers", urlPattern: /\/admin\/customers/ },
  203 |       { testId: "nav-config", urlPattern: /\/admin\/config/ },
  204 |     ];
  205 | 
  206 |     for (const link of navLinks) {
  207 |       const navItem = page.locator(`[data-testid="${link.testId}"]`);
  208 |       if (await navItem.isVisible({ timeout: 2000 }).catch(() => false)) {
  209 |         await navItem.click();
  210 |         await page.waitForURL(link.urlPattern);
  211 |         await page.goBack();
  212 |         await page.waitForURL("**/admin");
  213 |       }
  214 |     }
  215 |   });
  216 | });
  217 | 
```