import { test, expect, Page } from "@playwright/test";

/**
 * E2E Test: Complete Checkout Flow
 *
 * Tests the full customer journey from product browsing to order confirmation.
 *
 * Prerequisites:
 *   - App running on localhost:3000
 *   - Test database seeded with sample products
 *   - Test user: test@example.com / Test1234!
 *
 * Run with: npx playwright test e2e/checkout.spec.ts
 */

const TEST_USER = {
  email: "test@example.com",
  password: "Test1234!",
};

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/");
}

test.describe("Checkout E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test("should browse products and add to cart", async ({ page }) => {
    // Navigate to products page
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Verify products are displayed
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();

    // Click on first product
    await productCards.first().click();
    await page.waitForURL("**/products/**");

    // Verify product detail page
    await expect(page.locator("h1")).toBeVisible();
    const price = page.locator('[data-testid="product-price"]');
    await expect(price).toBeVisible();

    // Add to cart
    const addToCartBtn = page.locator('[data-testid="add-to-cart"]');
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Verify cart badge updates
    const cartBadge = page.locator('[data-testid="cart-count"]');
    await expect(cartBadge).toContainText("1");
  });

  test("should complete full checkout flow", async ({ page }) => {
    // Step 1: Add product to cart
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const addToCartBtn = page.locator('[data-testid="quick-add-to-cart"]').first();
    await addToCartBtn.click();

    // Step 2: Go to cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForURL("**/cart");

    // Verify cart has items
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems.first()).toBeVisible();

    // Verify subtotal is displayed
    const subtotal = page.locator('[data-testid="cart-subtotal"]');
    await expect(subtotal).toBeVisible();

    // Step 3: Proceed to checkout
    await page.click('[data-testid="checkout-btn"]');
    await page.waitForURL("**/checkout**");

    // Step 4: Fill delivery address
    const addressForm = page.locator('[data-testid="address-form"]');
    if (await addressForm.isVisible()) {
      await page.fill('[data-testid="address-line1"]', "123 Test Street");
      await page.fill('[data-testid="address-city"]', "Test City");
      await page.fill('[data-testid="address-pincode"]', "110001");
      await page.fill('[data-testid="address-phone"]', "+919876543210");
      await page.click('[data-testid="save-address-btn"]');
    }

    // Step 5: Select delivery slot (if applicable)
    const slotPicker = page.locator('[data-testid="delivery-slot-picker"]');
    if (await slotPicker.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click('[data-testid="slot-option"]').first();
    }

    // Step 6: Select payment method
    await page.click('[data-testid="payment-option-cod"]');

    // Step 7: Place order
    await page.click('[data-testid="place-order-btn"]');

    // Step 8: Verify order confirmation
    await page.waitForURL("**/orders/**", { timeout: 15000 });
    const confirmation = page.locator('[data-testid="order-confirmation"]');
    await expect(confirmation).toBeVisible({ timeout: 10000 });

    // Verify order number is displayed
    const orderNumber = page.locator('[data-testid="order-number"]');
    await expect(orderNumber).toBeVisible();
    await expect(orderNumber).toContainText("ORD");
  });

  test("should apply coupon code during checkout", async ({ page }) => {
    // Add to cart
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="quick-add-to-cart"]').first().click();

    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForURL("**/cart");

    // Apply coupon
    const couponInput = page.locator('[data-testid="coupon-input"]');
    if (await couponInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await couponInput.fill("SAVE10");
      await page.click('[data-testid="apply-coupon-btn"]');

      // Verify discount is applied
      const discount = page.locator('[data-testid="cart-discount"]');
      await expect(discount).toBeVisible({ timeout: 5000 });
    }
  });

  test("should handle out-of-stock gracefully", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Find an out-of-stock product (if any)
    const outOfStock = page.locator('[data-testid="out-of-stock-badge"]');
    const count = await outOfStock.count();

    if (count > 0) {
      // Verify add to cart is disabled
      const parent = outOfStock.first().locator("..");
      const addBtn = parent.locator('[data-testid="quick-add-to-cart"]');
      if (await addBtn.count() > 0) {
        await expect(addBtn).toBeDisabled();
      }
    }
  });

  test("should persist cart across page navigations", async ({ page }) => {
    // Add to cart
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="quick-add-to-cart"]').first().click();

    // Verify cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");

    // Navigate away
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Cart count should persist
    await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");

    // Navigate to another page
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Still persisted
    await expect(page.locator('[data-testid="cart-count"]')).toContainText("1");
  });
});
