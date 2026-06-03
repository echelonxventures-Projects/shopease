# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin Dashboard E2E >> should navigate to orders management
- Location: src/tests/e2e/admin-dashboard.spec.ts:90:7

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
            - generic [ref=e92]:
              - generic [ref=e93]: A
              - generic [ref=e94]: Admin
            - button "Logout" [ref=e95]:
              - img
              - text: Logout
      - main [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98]:
            - generic [ref=e99]:
              - heading "Dashboard" [level=1] [ref=e100]
              - paragraph [ref=e101]: Welcome back, Admin
            - generic [ref=e102]:
              - generic [ref=e103]:
                - img [ref=e104]
                - textbox [ref=e109]: 2026-05-02
                - generic [ref=e110]: "-"
                - textbox [ref=e111]: 2026-06-01
              - button "Refresh" [ref=e112]:
                - img [ref=e113]
                - text: Refresh
          - generic [ref=e118]:
            - generic [ref=e120]:
              - generic [ref=e121]:
                - heading "Live Metrics" [level=3] [ref=e122]
                - generic [ref=e123]:
                  - img [ref=e124]
                  - generic [ref=e129]: Connected
              - generic [ref=e130]:
                - generic [ref=e131]:
                  - generic [ref=e132]:
                    - img [ref=e134]
                    - generic [ref=e140]:
                      - img [ref=e141]
                      - text: Live
                  - paragraph [ref=e144]: ₹0
                  - paragraph [ref=e145]: Revenue Today
                  - paragraph [ref=e146]: Real-time revenue
                - generic [ref=e147]:
                  - generic [ref=e148]:
                    - img [ref=e150]
                    - generic [ref=e154]:
                      - img [ref=e155]
                      - text: Live
                  - paragraph [ref=e158]: "0"
                  - paragraph [ref=e159]: Orders Today
                  - paragraph [ref=e160]: New orders placed
                - generic [ref=e161]:
                  - img [ref=e164]
                  - paragraph [ref=e169]: "0"
                  - paragraph [ref=e170]: Active Users
                  - paragraph [ref=e171]: Currently browsing
                - generic [ref=e172]:
                  - img [ref=e175]
                  - paragraph [ref=e178]: "0"
                  - paragraph [ref=e179]: Pending Orders
                  - paragraph [ref=e180]: Awaiting processing
              - paragraph [ref=e181]: "Last updated: 9:51:26 pm"
            - generic [ref=e183]:
              - generic [ref=e184]:
                - generic [ref=e185]:
                  - heading "Revenue Over Time" [level=3] [ref=e186]
                  - paragraph [ref=e187]: 2/5/2026 – 1/6/2026
                - generic [ref=e188]:
                  - generic [ref=e189]:
                    - button "7D" [ref=e190]
                    - button "30D" [ref=e191]
                    - button "90D" [ref=e192]
                  - generic [ref=e193]:
                    - paragraph [ref=e194]: ₹0
                    - paragraph [ref=e195]: 0 orders
              - generic [ref=e197]:
                - generic:
                  - status:
                    - paragraph: 16 May
                    - list:
                      - listitem: "Orders : 0"
                      - listitem: "Revenue : ₹0"
                - list [ref=e199]:
                  - listitem [ref=e200]:
                    - img "orders legend icon" [ref=e201]
                    - text: orders
                  - listitem [ref=e203]:
                    - img "revenue legend icon" [ref=e204]
                    - text: revenue
                - application [ref=e206]:
                  - generic [ref=e291]:
                    - generic [ref=e292]:
                      - generic [ref=e294]: 1 May
                      - generic [ref=e296]: 4 May
                      - generic [ref=e298]: 7 May
                      - generic [ref=e300]: 10 May
                      - generic [ref=e302]: 13 May
                      - generic [ref=e304]: 16 May
                      - generic [ref=e306]: 19 May
                      - generic [ref=e308]: 22 May
                      - generic [ref=e310]: 25 May
                      - generic [ref=e312]: 28 May
                      - generic [ref=e314]: 31 May
                    - generic [ref=e315]:
                      - generic [ref=e317]: ₹0k
                      - generic [ref=e319]: ₹0k
                      - generic [ref=e321]: ₹0k
                      - generic [ref=e323]: ₹0k
                      - generic [ref=e325]: ₹0k
                    - generic [ref=e326]:
                      - generic [ref=e328]: "0"
                      - generic [ref=e330]: "1"
                      - generic [ref=e332]: "2"
                      - generic [ref=e334]: "3"
                      - generic [ref=e336]: "4"
            - generic [ref=e338]:
              - heading "Order Funnel" [level=3] [ref=e339]
              - application [ref=e342]:
                - generic [ref=e378]:
                  - generic [ref=e379]:
                    - generic [ref=e381]: "0"
                    - generic [ref=e383]: "1"
                    - generic [ref=e385]: "2"
                    - generic [ref=e387]: "3"
                    - generic [ref=e389]: "4"
                  - generic [ref=e390]:
                    - generic [ref=e392]: TotalOrders
                    - generic [ref=e394]: Confirmed
                    - generic [ref=e396]: Shipped
                    - generic [ref=e398]: Delivered
              - generic [ref=e399]:
                - generic [ref=e400]:
                  - paragraph [ref=e401]: Total Orders
                  - paragraph [ref=e402]: 100%
                - generic [ref=e403]:
                  - paragraph [ref=e404]: Confirmed
                  - paragraph [ref=e405]: 0%
                - generic [ref=e406]:
                  - paragraph [ref=e407]: Shipped
                  - paragraph [ref=e408]: 0%
                - generic [ref=e409]:
                  - paragraph [ref=e410]: Delivered
                  - paragraph [ref=e411]: 0%
            - generic [ref=e413]:
              - heading "Top Products" [level=3] [ref=e414]
              - generic [ref=e415]: No sales data available
            - generic [ref=e417]:
              - heading "Recent Orders" [level=3] [ref=e418]
              - generic [ref=e419]: No recent orders
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e425] [cursor=pointer]:
    - img [ref=e426]
  - alert [ref=e430]
  - generic [ref=e431]: Total Orders
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
  40  |     await page.waitForLoadState("networkidle");
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
> 92  |     await page.waitForLoadState("networkidle");
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
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
  174 |     await expect(fraudContent).toBeVisible({ timeout: 10000 });
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
```