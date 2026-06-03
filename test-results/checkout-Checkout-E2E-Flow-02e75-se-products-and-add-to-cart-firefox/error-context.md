# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout E2E Flow >> should browse products and add to cart
- Location: src/tests/e2e/checkout.spec.ts:35:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="product-card"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="product-card"]').first()

```

```yaml
- banner:
  - link "ShopEase":
    - /url: /
  - searchbox "Search products"
  - img
  - button "Voice search"
  - button "Image search"
  - navigation:
    - button "en-US"
    - button "₹ IN"
    - combobox:
      - option "د.إ AED"
      - option "AR$ ARS"
      - option "A$ AUD"
      - option "৳ BDT"
      - option "R$ BRL"
      - option "C$ CAD"
      - option "Fr CHF"
      - option "CL$ CLP"
      - option "¥ CNY"
      - option "CO$ COP"
      - option "kr DKK"
      - option "£ EGP"
      - option "€ EUR"
      - option "£ GBP"
      - option "Rp IDR"
      - option "₹ INR" [selected]
      - option "¥ JPY"
      - option "KSh KES"
      - option "₩ KRW"
      - option "MX$ MXN"
      - option "RM MYR"
      - option "₦ NGN"
      - option "kr NOK"
      - option "NZ$ NZD"
      - option "₱ PHP"
      - option "₨ PKR"
      - option "zł PLN"
      - option "₽ RUB"
      - option "﷼ SAR"
      - option "kr SEK"
      - option "S$ SGD"
      - option "฿ THB"
      - option "₺ TRY"
      - option "$ USD"
      - option "₫ VND"
      - option "R ZAR"
    - button "Switch to dark mode"
    - link "Fresh":
      - /url: /groceries
    - link "Streaming":
      - /url: /streaming
    - link "Trading":
      - /url: /trading
    - link "Brands":
      - /url: /brands
    - link "Gift Cards":
      - /url: /gift-cards
    - link "Wishlist":
      - /url: /wishlist
    - button "Open cart": Cart
    - button "T"
- text: Subscribe & Save 5% off Come back! 10% off your cart 10% off Flash Sale 20% Off 20% off Use FLASH20 UPI Payment 5% Cashback 5% off Use UPICASH Free Shipping Over ₹999 ₹50 off Use FREESHIP
- main:
  - heading "All Products" [level=1]
  - complementary:
    - heading "Category" [level=3]
    - combobox:
      - option "All Categories" [selected]
      - option "Electronics"
      - option "Fashion"
      - option "Home & Kitchen"
      - option "Grocery"
      - option "Beauty"
      - option "Books"
      - option "Toys & Games"
      - option "Sports"
    - heading "Brand" [level=3]
    - combobox:
      - option "All Brands" [selected]
      - option "Apple"
      - option "Samsung"
      - option "Sony"
      - option "Nike"
      - option "Adidas"
      - option "Levi's"
      - option "HP"
      - option "Dell"
      - option "LG"
      - option "Bose"
    - heading "Condition" [level=3]
    - combobox:
      - option "Any Condition" [selected]
      - option "New"
      - option "Like New"
      - option "Refurbished"
      - option "Certified Refurbished"
      - option "Used - Good"
      - option "Used - Fair"
    - heading "Gender" [level=3]
    - combobox:
      - option "All" [selected]
      - option "Men"
      - option "Women"
      - option "Unisex"
      - option "Kids"
    - heading "Dietary" [level=3]
    - combobox:
      - option "Any" [selected]
      - option "Vegan"
      - option "Organic"
      - option "Gluten Free"
      - option "Halal"
      - option "Kosher"
    - checkbox "Free Shipping Only"
    - text: Free Shipping Only
    - heading "Sort By" [level=3]
    - combobox:
      - option "Newest" [selected]
      - 'option "Price: Low to High"'
      - 'option "Price: High to Low"'
      - option "Highest Rated"
      - option "Most Popular"
  - paragraph: 0 products found
  - paragraph: No products found
  - paragraph: Try adjusting your search or filters
- contentinfo: © 2026 ShopEase. All rights reserved.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * E2E Test: Complete Checkout Flow
  5   |  *
  6   |  * Tests the full customer journey from product browsing to order confirmation.
  7   |  *
  8   |  * Prerequisites:
  9   |  *   - App running on localhost:3000
  10  |  *   - Test database seeded with sample products
  11  |  *   - Test user: test@example.com / Test1234!
  12  |  *
  13  |  * Run with: npx playwright test e2e/checkout.spec.ts
  14  |  */
  15  | 
  16  | const TEST_USER = {
  17  |   email: "test@example.com",
  18  |   password: "Test1234!",
  19  | };
  20  | 
  21  | async function login(page: Page) {
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
> 42  |     await expect(productCards.first()).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
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
  122 |     await page.goto("/products");
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
```