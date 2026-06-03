# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout E2E Flow >> should apply coupon code during checkout
- Location: src/tests/e2e/checkout.spec.ts:120:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/products", waiting until "load"

```

# Test source

```ts
  22  |   await page.goto("/auth/login");
  23  |   await page.fill('input[name="email"]', TEST_USER.email);
  24  |   await page.fill('input[name="password"]', TEST_USER.password);
  25  |   await page.click('button[type="submit"]');
  26  |   await page.waitForURL("**/");
  27  | }
  28  | 
  29  | test.describe("Checkout E2E Flow", () => {
  30  |   test.beforeEach(async ({ page }) => {
  31  |     // Login before each test
  32  |     await login(page);
  33  |   });
  34  | 
  35  |   test("should browse products and add to cart", async ({ page }) => {
  36  |     // Navigate to products page
  37  |     await page.goto("/products");
  38  |     await page.waitForLoadState("networkidle");
  39  | 
  40  |     // Verify products are displayed
  41  |     const productCards = page.locator('[data-testid="product-card"]');
  42  |     await expect(productCards.first()).toBeVisible();
  43  | 
  44  |     // Click on first product
  45  |     await productCards.first().click();
  46  |     await page.waitForURL("**/products/**");
  47  | 
  48  |     // Verify product detail page
  49  |     await expect(page.locator("h1")).toBeVisible();
  50  |     const price = page.locator('[data-testid="product-price"]');
  51  |     await expect(price).toBeVisible();
  52  | 
  53  |     // Add to cart
  54  |     const addToCartBtn = page.locator('[data-testid="add-to-cart"]');
  55  |     await expect(addToCartBtn).toBeVisible();
  56  |     await addToCartBtn.click();
  57  | 
  58  |     // Verify cart badge updates
  59  |     const cartBadge = page.locator('[data-testid="cart-count"]');
  60  |     await expect(cartBadge).toContainText("1");
  61  |   });
  62  | 
  63  |   test("should complete full checkout flow", async ({ page }) => {
  64  |     // Step 1: Add product to cart
  65  |     await page.goto("/products");
  66  |     await page.waitForLoadState("networkidle");
  67  | 
  68  |     const addToCartBtn = page.locator('[data-testid="quick-add-to-cart"]').first();
  69  |     await addToCartBtn.click();
  70  | 
  71  |     // Step 2: Go to cart
  72  |     await page.click('[data-testid="cart-icon"]');
  73  |     await page.waitForURL("**/cart");
  74  | 
  75  |     // Verify cart has items
  76  |     const cartItems = page.locator('[data-testid="cart-item"]');
  77  |     await expect(cartItems.first()).toBeVisible();
  78  | 
  79  |     // Verify subtotal is displayed
  80  |     const subtotal = page.locator('[data-testid="cart-subtotal"]');
  81  |     await expect(subtotal).toBeVisible();
  82  | 
  83  |     // Step 3: Proceed to checkout
  84  |     await page.click('[data-testid="checkout-btn"]');
  85  |     await page.waitForURL("**/checkout**");
  86  | 
  87  |     // Step 4: Fill delivery address
  88  |     const addressForm = page.locator('[data-testid="address-form"]');
  89  |     if (await addressForm.isVisible()) {
  90  |       await page.fill('[data-testid="address-line1"]', "123 Test Street");
  91  |       await page.fill('[data-testid="address-city"]', "Test City");
  92  |       await page.fill('[data-testid="address-pincode"]', "110001");
  93  |       await page.fill('[data-testid="address-phone"]', "+919876543210");
  94  |       await page.click('[data-testid="save-address-btn"]');
  95  |     }
  96  | 
  97  |     // Step 5: Select delivery slot (if applicable)
  98  |     const slotPicker = page.locator('[data-testid="delivery-slot-picker"]');
  99  |     if (await slotPicker.isVisible({ timeout: 3000 }).catch(() => false)) {
  100 |       await page.click('[data-testid="slot-option"]').first();
  101 |     }
  102 | 
  103 |     // Step 6: Select payment method
  104 |     await page.click('[data-testid="payment-option-cod"]');
  105 | 
  106 |     // Step 7: Place order
  107 |     await page.click('[data-testid="place-order-btn"]');
  108 | 
  109 |     // Step 8: Verify order confirmation
  110 |     await page.waitForURL("**/orders/**", { timeout: 15000 });
  111 |     const confirmation = page.locator('[data-testid="order-confirmation"]');
  112 |     await expect(confirmation).toBeVisible({ timeout: 10000 });
  113 | 
  114 |     // Verify order number is displayed
  115 |     const orderNumber = page.locator('[data-testid="order-number"]');
  116 |     await expect(orderNumber).toBeVisible();
  117 |     await expect(orderNumber).toContainText("ORD");
  118 |   });
  119 | 
  120 |   test("should apply coupon code during checkout", async ({ page }) => {
  121 |     // Add to cart
> 122 |     await page.goto("/products");
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  123 |     await page.waitForLoadState("networkidle");
  124 |     await page.locator('[data-testid="quick-add-to-cart"]').first().click();
  125 | 
  126 |     // Go to cart
  127 |     await page.click('[data-testid="cart-icon"]');
  128 |     await page.waitForURL("**/cart");
  129 | 
  130 |     // Apply coupon
  131 |     const couponInput = page.locator('[data-testid="coupon-input"]');
  132 |     if (await couponInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  133 |       await couponInput.fill("SAVE10");
  134 |       await page.click('[data-testid="apply-coupon-btn"]');
  135 | 
  136 |       // Verify discount is applied
  137 |       const discount = page.locator('[data-testid="cart-discount"]');
  138 |       await expect(discount).toBeVisible({ timeout: 5000 });
  139 |     }
  140 |   });
  141 | 
  142 |   test("should handle out-of-stock gracefully", async ({ page }) => {
  143 |     await page.goto("/products");
  144 |     await page.waitForLoadState("networkidle");
  145 | 
  146 |     // Find an out-of-stock product (if any)
  147 |     const outOfStock = page.locator('[data-testid="out-of-stock-badge"]');
  148 |     const count = await outOfStock.count();
  149 | 
  150 |     if (count > 0) {
  151 |       // Verify add to cart is disabled
  152 |       const parent = outOfStock.first().locator("..");
  153 |       const addBtn = parent.locator('[data-testid="quick-add-to-cart"]');
  154 |       if (await addBtn.count() > 0) {
  155 |         await expect(addBtn).toBeDisabled();
  156 |       }
  157 |     }
  158 |   });
  159 | 
  160 |   test("should persist cart across page navigations", async ({ page }) => {
  161 |     // Add to cart
  162 |     await page.goto("/products");
  163 |     await page.waitForLoadState("networkidle");
  164 |     await page.locator('[data-testid="quick-add-to-cart"]').first().click();
  165 | 
  166 |     // Verify cart count
  167 |     await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");
  168 | 
  169 |     // Navigate away
  170 |     await page.goto("/");
  171 |     await page.waitForLoadState("networkidle");
  172 | 
  173 |     // Cart count should persist
  174 |     await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");
  175 | 
  176 |     // Navigate to another page
  177 |     await page.goto("/products");
  178 |     await page.waitForLoadState("networkidle");
  179 | 
  180 |     // Still persisted
  181 |     await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");
  182 |   });
  183 | });
  184 | 
```