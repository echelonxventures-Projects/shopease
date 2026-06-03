# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin Dashboard E2E >> should navigate between admin sections
- Location: src/tests/e2e/admin-dashboard.spec.ts:195:7

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
                - textbox [ref=e106]: 2026-05-02
                - generic [ref=e107]: "-"
                - textbox [ref=e108]: 2026-06-01
              - button "Refresh" [ref=e109]:
                - img [ref=e110]
                - text: Refresh
          - generic [ref=e115]:
            - generic [ref=e117]:
              - generic [ref=e118]:
                - heading "Live Metrics" [level=3] [ref=e119]
                - generic [ref=e120]:
                  - img [ref=e121]
                  - generic [ref=e125]: Connected
              - generic [ref=e126]:
                - generic [ref=e127]:
                  - generic [ref=e128]:
                    - img [ref=e130]
                    - generic [ref=e133]:
                      - img [ref=e134]
                      - text: Live
                  - paragraph [ref=e137]: ₹0
                  - paragraph [ref=e138]: Revenue Today
                  - paragraph [ref=e139]: Real-time revenue
                - generic [ref=e140]:
                  - generic [ref=e141]:
                    - img [ref=e143]
                    - generic [ref=e147]:
                      - img [ref=e148]
                      - text: Live
                  - paragraph [ref=e151]: "0"
                  - paragraph [ref=e152]: Orders Today
                  - paragraph [ref=e153]: New orders placed
                - generic [ref=e154]:
                  - img [ref=e157]
                  - paragraph [ref=e162]: "0"
                  - paragraph [ref=e163]: Active Users
                  - paragraph [ref=e164]: Currently browsing
                - generic [ref=e165]:
                  - img [ref=e168]
                  - paragraph [ref=e171]: "0"
                  - paragraph [ref=e172]: Pending Orders
                  - paragraph [ref=e173]: Awaiting processing
              - paragraph [ref=e174]: "Last updated: 9:49:45 pm"
            - generic [ref=e176]:
              - generic [ref=e177]:
                - generic [ref=e178]:
                  - heading "Revenue Over Time" [level=3] [ref=e179]
                  - paragraph [ref=e180]: 2/5/2026 – 1/6/2026
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - button "7D" [ref=e183]
                    - button "30D" [ref=e184]
                    - button "90D" [ref=e185]
                  - generic [ref=e186]:
                    - paragraph [ref=e187]: ₹0
                    - paragraph [ref=e188]: 0 orders
              - generic [ref=e190]:
                - list [ref=e192]:
                  - listitem [ref=e193]:
                    - img "orders legend icon" [ref=e194]
                    - text: orders
                  - listitem [ref=e196]:
                    - img "revenue legend icon" [ref=e197]
                    - text: revenue
                - application [ref=e199]:
                  - generic [ref=e214]:
                    - generic [ref=e215]:
                      - generic [ref=e217]: 1 May
                      - generic [ref=e219]: 4 May
                      - generic [ref=e221]: 7 May
                      - generic [ref=e223]: 10 May
                      - generic [ref=e225]: 13 May
                      - generic [ref=e227]: 16 May
                      - generic [ref=e229]: 19 May
                      - generic [ref=e231]: 22 May
                      - generic [ref=e233]: 25 May
                      - generic [ref=e235]: 28 May
                      - generic [ref=e237]: 31 May
                    - generic [ref=e238]:
                      - generic [ref=e240]: ₹0k
                      - generic [ref=e242]: ₹0k
                      - generic [ref=e244]: ₹0k
                      - generic [ref=e246]: ₹0k
                      - generic [ref=e248]: ₹0k
                    - generic [ref=e249]:
                      - generic [ref=e251]: "0"
                      - generic [ref=e253]: "1"
                      - generic [ref=e255]: "2"
                      - generic [ref=e257]: "3"
                      - generic [ref=e259]: "4"
            - generic [ref=e261]:
              - heading "Order Funnel" [level=3] [ref=e262]
              - application [ref=e265]:
                - generic [ref=e276]:
                  - generic [ref=e277]:
                    - generic [ref=e279]: "0"
                    - generic [ref=e281]: "1"
                    - generic [ref=e283]: "2"
                    - generic [ref=e285]: "3"
                    - generic [ref=e287]: "4"
                  - generic [ref=e288]:
                    - generic [ref=e290]: TotalOrders
                    - generic [ref=e292]: Confirmed
                    - generic [ref=e294]: Shipped
                    - generic [ref=e296]: Delivered
              - generic [ref=e297]:
                - generic [ref=e298]:
                  - paragraph [ref=e299]: Total Orders
                  - paragraph [ref=e300]: 100%
                - generic [ref=e301]:
                  - paragraph [ref=e302]: Confirmed
                  - paragraph [ref=e303]: 0%
                - generic [ref=e304]:
                  - paragraph [ref=e305]: Shipped
                  - paragraph [ref=e306]: 0%
                - generic [ref=e307]:
                  - paragraph [ref=e308]: Delivered
                  - paragraph [ref=e309]: 0%
            - generic [ref=e311]:
              - heading "Top Products" [level=3] [ref=e312]
              - generic [ref=e313]: No sales data available
            - generic [ref=e315]:
              - heading "Recent Orders" [level=3] [ref=e316]
              - generic [ref=e317]: No recent orders
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e323] [cursor=pointer]:
    - img [ref=e324]
  - alert [ref=e327]
  - generic [ref=e328]: Total Orders
```

# Test source

```ts
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
  193 |   });
  194 | 
  195 |   test("should navigate between admin sections", async ({ page }) => {
  196 |     await page.goto("/admin");
> 197 |     await page.waitForLoadState("networkidle");
      |                ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
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