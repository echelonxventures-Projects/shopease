# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browse-products.spec.ts >> Product Browsing >> shows category navigation
- Location: src/tests/e2e/browse-products.spec.ts:15:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "ShopEase" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e9]:
          - searchbox "Search products" [ref=e10]
          - img [ref=e11]
          - button "Voice search" [ref=e13]:
            - img [ref=e14]
          - button "Image search" [ref=e17]:
            - img [ref=e18]
        - navigation [ref=e21]:
          - button "en-US" [ref=e23]:
            - img [ref=e24]
            - generic [ref=e27]: en-US
          - button "₹ IN" [ref=e29]:
            - img [ref=e30]
            - generic [ref=e33]: ₹ IN
          - button "Switch to dark mode" [ref=e34]:
            - img [ref=e35]
          - link "Fresh" [ref=e37] [cursor=pointer]:
            - /url: /groceries
          - link "Streaming" [ref=e38] [cursor=pointer]:
            - /url: /streaming
          - link "Trading" [ref=e39] [cursor=pointer]:
            - /url: /trading
          - link "Brands" [ref=e40] [cursor=pointer]:
            - /url: /brands
          - link "Gift Cards" [ref=e41] [cursor=pointer]:
            - /url: /gift-cards
          - link "Wishlist" [ref=e42] [cursor=pointer]:
            - /url: /wishlist
          - button "Open cart" [ref=e43]: Cart
    - main [ref=e45]:
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e49]:
            - heading "Summer Sale Up to 50% Off" [level=1] [ref=e50]
            - paragraph [ref=e51]: Huge discounts on electronics, fashion & more
          - generic [ref=e52]:
            - button [ref=e53]
            - button [ref=e54]
            - button [ref=e55]
        - generic [ref=e57]:
          - link "📁 Electronics" [ref=e58] [cursor=pointer]:
            - /url: /category/electronics
            - generic [ref=e59]: 📁
            - text: Electronics
          - link "📁 Fashion" [ref=e60] [cursor=pointer]:
            - /url: /category/fashion
            - generic [ref=e61]: 📁
            - text: Fashion
          - link "📁 Home & Kitchen" [ref=e62] [cursor=pointer]:
            - /url: /category/home-kitchen
            - generic [ref=e63]: 📁
            - text: Home & Kitchen
          - link "📁 Grocery" [ref=e64] [cursor=pointer]:
            - /url: /category/grocery
            - generic [ref=e65]: 📁
            - text: Grocery
          - link "📁 Beauty" [ref=e66] [cursor=pointer]:
            - /url: /category/beauty
            - generic [ref=e67]: 📁
            - text: Beauty
          - link "📁 Books" [ref=e68] [cursor=pointer]:
            - /url: /category/books
            - generic [ref=e69]: 📁
            - text: Books
          - link "📁 Toys & Games" [ref=e70] [cursor=pointer]:
            - /url: /category/toys-games
            - generic [ref=e71]: 📁
            - text: Toys & Games
          - link "📁 Sports" [ref=e72] [cursor=pointer]:
            - /url: /category/sports
            - generic [ref=e73]: 📁
            - text: Sports
        - generic [ref=e74]:
          - status "Loading recommendations" [ref=e75]:
            - generic [ref=e76]:
              - img [ref=e77]
              - heading "AI Recommendations" [level=2] [ref=e80]
              - img [ref=e81]
          - status [ref=e83]:
            - generic [ref=e84]:
              - img [ref=e85]
              - heading "Recently Viewed" [level=2] [ref=e88]
              - img [ref=e89]
        - generic [ref=e91]:
          - generic [ref=e92]:
            - heading "Featured Products" [level=2] [ref=e93]
            - link "View All →" [ref=e94] [cursor=pointer]:
              - /url: /products
          - generic [ref=e95]:
            - 'link "iPhone 15 Pro Max 11% off iPhone 15 Pro Max Apple ₹1,59,900 ₹1,79,900 (0) #1 Best Seller Get it by Mon, 8 Jun FREE Delivery Add to Cart" [ref=e96] [cursor=pointer]':
              - /url: /products/iphone-15-pro-max
              - generic [ref=e97]:
                - generic [ref=e98]:
                  - img "iPhone 15 Pro Max" [ref=e99]
                  - generic [ref=e100]: 11% off
                  - button [ref=e101]:
                    - img [ref=e102]
                - generic [ref=e104]:
                  - heading "iPhone 15 Pro Max" [level=3] [ref=e105]
                  - paragraph [ref=e106]: Apple
                  - generic [ref=e107]:
                    - generic [ref=e108]: ₹1,59,900
                    - generic [ref=e109]: ₹1,79,900
                  - generic [ref=e111]: (0)
                  - generic [ref=e113]: "#1 Best Seller"
                  - generic [ref=e114]: Get it by Mon, 8 Jun
                  - generic [ref=e115]: FREE Delivery
                  - button "Add to Cart" [ref=e116]:
                    - img
                    - text: Add to Cart
            - link "Samsung Galaxy S24 Ultra 7% off Samsung Galaxy S24 Ultra Samsung ₹1,39,900 ₹1,49,900 (0) Get it by Wed, 3 Jun FREE Delivery Add to Cart" [ref=e117] [cursor=pointer]:
              - /url: /products/samsung-galaxy-s24-ultra
              - generic [ref=e118]:
                - generic [ref=e119]:
                  - img "Samsung Galaxy S24 Ultra" [ref=e120]
                  - generic [ref=e121]: 7% off
                  - button [ref=e122]:
                    - img [ref=e123]
                - generic [ref=e125]:
                  - heading "Samsung Galaxy S24 Ultra" [level=3] [ref=e126]
                  - paragraph [ref=e127]: Samsung
                  - generic [ref=e128]:
                    - generic [ref=e129]: ₹1,39,900
                    - generic [ref=e130]: ₹1,49,900
                  - generic [ref=e132]: (0)
                  - generic [ref=e133]: Get it by Wed, 3 Jun
                  - generic [ref=e134]: FREE Delivery
                  - button "Add to Cart" [ref=e135]:
                    - img
                    - text: Add to Cart
            - 'link "MacBook Pro 14-inch M3 Pro 9% off MacBook Pro 14-inch M3 Pro Apple ₹1,99,900 ₹2,19,900 (0) #1 Best Seller Get it by Fri, 5 Jun FREE Delivery Add to Cart" [ref=e136] [cursor=pointer]':
              - /url: /products/macbook-pro-14-m3
              - generic [ref=e137]:
                - generic [ref=e138]:
                  - img "MacBook Pro 14-inch M3 Pro" [ref=e139]
                  - generic [ref=e140]: 9% off
                  - button [ref=e141]:
                    - img [ref=e142]
                - generic [ref=e144]:
                  - heading "MacBook Pro 14-inch M3 Pro" [level=3] [ref=e145]
                  - paragraph [ref=e146]: Apple
                  - generic [ref=e147]:
                    - generic [ref=e148]: ₹1,99,900
                    - generic [ref=e149]: ₹2,19,900
                  - generic [ref=e151]: (0)
                  - generic [ref=e153]: "#1 Best Seller"
                  - generic [ref=e154]: Get it by Fri, 5 Jun
                  - generic [ref=e155]: FREE Delivery
                  - button "Add to Cart" [ref=e156]:
                    - img
                    - text: Add to Cart
            - 'link "Sony WH-1000XM5 14% off Sony WH-1000XM5 Sony ₹29,990 ₹34,990 (0) #1 Best Seller Get it by Thu, 4 Jun FREE Delivery Add to Cart" [ref=e157] [cursor=pointer]':
              - /url: /products/sony-wh-1000xm5
              - generic [ref=e158]:
                - generic [ref=e159]:
                  - img "Sony WH-1000XM5" [ref=e160]
                  - generic [ref=e161]: 14% off
                  - button [ref=e162]:
                    - img [ref=e163]
                - generic [ref=e165]:
                  - heading "Sony WH-1000XM5" [level=3] [ref=e166]
                  - paragraph [ref=e167]: Sony
                  - generic [ref=e168]:
                    - generic [ref=e169]: ₹29,990
                    - generic [ref=e170]: ₹34,990
                  - generic [ref=e172]: (0)
                  - generic [ref=e174]: "#1 Best Seller"
                  - generic [ref=e175]: Get it by Thu, 4 Jun
                  - generic [ref=e176]: FREE Delivery
                  - button "Add to Cart" [ref=e177]:
                    - img
                    - text: Add to Cart
            - 'link "Nike Air Max 270 13% off Nike Air Max 270 Nike ₹12,995 ₹14,995 (0) #1 Best Seller Get it by Fri, 5 Jun FREE Delivery Add to Cart" [ref=e178] [cursor=pointer]':
              - /url: /products/nike-air-max-270
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - img "Nike Air Max 270" [ref=e181]
                  - generic [ref=e182]: 13% off
                  - button [ref=e183]:
                    - img [ref=e184]
                - generic [ref=e186]:
                  - heading "Nike Air Max 270" [level=3] [ref=e187]
                  - paragraph [ref=e188]: Nike
                  - generic [ref=e189]:
                    - generic [ref=e190]: ₹12,995
                    - generic [ref=e191]: ₹14,995
                  - generic [ref=e193]: (0)
                  - generic [ref=e195]: "#1 Best Seller"
                  - generic [ref=e196]: Get it by Fri, 5 Jun
                  - generic [ref=e197]: FREE Delivery
                  - button "Add to Cart" [ref=e198]:
                    - img
                    - text: Add to Cart
        - generic [ref=e199]:
          - generic [ref=e200]:
            - heading "Shop by Brand" [level=2] [ref=e201]
            - link "View All →" [ref=e202] [cursor=pointer]:
              - /url: /brands
          - generic [ref=e203]:
            - link "A Apple" [ref=e204] [cursor=pointer]:
              - /url: /brands/apple
              - generic [ref=e206]: A
              - generic [ref=e207]: Apple
            - link "S Samsung" [ref=e208] [cursor=pointer]:
              - /url: /brands/samsung
              - generic [ref=e210]: S
              - generic [ref=e211]: Samsung
            - link "S Sony" [ref=e212] [cursor=pointer]:
              - /url: /brands/sony
              - generic [ref=e214]: S
              - generic [ref=e215]: Sony
            - link "N Nike" [ref=e216] [cursor=pointer]:
              - /url: /brands/nike
              - generic [ref=e218]: "N"
              - generic [ref=e219]: Nike
            - link "A Adidas" [ref=e220] [cursor=pointer]:
              - /url: /brands/adidas
              - generic [ref=e222]: A
              - generic [ref=e223]: Adidas
            - link "L Levi's" [ref=e224] [cursor=pointer]:
              - /url: /brands/levis
              - generic [ref=e226]: L
              - generic [ref=e227]: Levi's
            - link "H HP" [ref=e228] [cursor=pointer]:
              - /url: /brands/hp
              - generic [ref=e230]: H
              - generic [ref=e231]: HP
            - link "D Dell" [ref=e232] [cursor=pointer]:
              - /url: /brands/dell
              - generic [ref=e234]: D
              - generic [ref=e235]: Dell
        - generic [ref=e236]:
          - heading "Shop by Category" [level=2] [ref=e237]
          - generic [ref=e238]:
            - link "Electronics 6 items" [ref=e239] [cursor=pointer]:
              - /url: /category/electronics
              - heading "Electronics" [level=3] [ref=e240]
              - paragraph [ref=e241]: 6 items
            - link "Fashion 0 items" [ref=e242] [cursor=pointer]:
              - /url: /category/fashion
              - heading "Fashion" [level=3] [ref=e243]
              - paragraph [ref=e244]: 0 items
            - link "Home & Kitchen 0 items" [ref=e245] [cursor=pointer]:
              - /url: /category/home-kitchen
              - heading "Home & Kitchen" [level=3] [ref=e246]
              - paragraph [ref=e247]: 0 items
            - link "Grocery 6 items" [ref=e248] [cursor=pointer]:
              - /url: /category/grocery
              - heading "Grocery" [level=3] [ref=e249]
              - paragraph [ref=e250]: 6 items
            - link "Beauty 2 items" [ref=e251] [cursor=pointer]:
              - /url: /category/beauty
              - heading "Beauty" [level=3] [ref=e252]
              - paragraph [ref=e253]: 2 items
            - link "Books 2 items" [ref=e254] [cursor=pointer]:
              - /url: /category/books
              - heading "Books" [level=3] [ref=e255]
              - paragraph [ref=e256]: 2 items
            - link "Toys & Games 1 items" [ref=e257] [cursor=pointer]:
              - /url: /category/toys-games
              - heading "Toys & Games" [level=3] [ref=e258]
              - paragraph [ref=e259]: 1 items
            - link "Sports 2 items" [ref=e260] [cursor=pointer]:
              - /url: /category/sports
              - heading "Sports" [level=3] [ref=e261]
              - paragraph [ref=e262]: 2 items
    - contentinfo [ref=e263]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e271] [cursor=pointer]:
    - img [ref=e272]
  - alert [ref=e275]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Product Browsing", () => {
  4  |   test("loads home page successfully", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/ShopEase/);
  7  |   });
  8  | 
  9  |   test("shows featured products on home page", async ({ page }) => {
  10 |     await page.goto("/");
  11 |     const heading = page.locator("h2:has-text('Featured Products')");
  12 |     await expect(heading).toBeVisible({ timeout: 10000 });
  13 |   });
  14 | 
  15 |   test("shows category navigation", async ({ page }) => {
  16 |     await page.goto("/");
  17 |     const categories = page.locator('[class*="CategoryNav"], [class*="category"]');
  18 |     const count = await categories.count();
> 19 |     expect(count).toBeGreaterThan(0);
     |                   ^ Error: expect(received).toBeGreaterThan(expected)
  20 |   });
  21 | });
  22 | 
```