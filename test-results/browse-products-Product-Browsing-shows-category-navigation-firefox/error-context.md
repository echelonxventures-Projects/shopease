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
          - button "Image search" [ref=e18]:
            - img [ref=e19]
        - navigation [ref=e22]:
          - button "en-US" [ref=e24]:
            - img [ref=e25]
            - generic [ref=e29]: en-US
          - button "₹ IN" [ref=e31]:
            - img [ref=e32]
            - generic [ref=e35]: ₹ IN
          - button "Switch to dark mode" [ref=e36]:
            - img [ref=e37]
          - link "Fresh" [ref=e39] [cursor=pointer]:
            - /url: /groceries
          - link "Streaming" [ref=e40] [cursor=pointer]:
            - /url: /streaming
          - link "Trading" [ref=e41] [cursor=pointer]:
            - /url: /trading
          - link "Brands" [ref=e42] [cursor=pointer]:
            - /url: /brands
          - link "Gift Cards" [ref=e43] [cursor=pointer]:
            - /url: /gift-cards
          - link "Wishlist" [ref=e44] [cursor=pointer]:
            - /url: /wishlist
          - button "Open cart" [ref=e45]: Cart
    - main [ref=e47]:
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e51]:
            - heading "Summer Sale Up to 50% Off" [level=1] [ref=e52]
            - paragraph [ref=e53]: Huge discounts on electronics, fashion & more
          - generic [ref=e54]:
            - button [ref=e55]
            - button [ref=e56]
            - button [ref=e57]
        - generic [ref=e59]:
          - link "📁 Electronics" [ref=e60] [cursor=pointer]:
            - /url: /category/electronics
            - generic [ref=e61]: 📁
            - text: Electronics
          - link "📁 Fashion" [ref=e62] [cursor=pointer]:
            - /url: /category/fashion
            - generic [ref=e63]: 📁
            - text: Fashion
          - link "📁 Home & Kitchen" [ref=e64] [cursor=pointer]:
            - /url: /category/home-kitchen
            - generic [ref=e65]: 📁
            - text: Home & Kitchen
          - link "📁 Grocery" [ref=e66] [cursor=pointer]:
            - /url: /category/grocery
            - generic [ref=e67]: 📁
            - text: Grocery
          - link "📁 Beauty" [ref=e68] [cursor=pointer]:
            - /url: /category/beauty
            - generic [ref=e69]: 📁
            - text: Beauty
          - link "📁 Books" [ref=e70] [cursor=pointer]:
            - /url: /category/books
            - generic [ref=e71]: 📁
            - text: Books
          - link "📁 Toys & Games" [ref=e72] [cursor=pointer]:
            - /url: /category/toys-games
            - generic [ref=e73]: 📁
            - text: Toys & Games
          - link "📁 Sports" [ref=e74] [cursor=pointer]:
            - /url: /category/sports
            - generic [ref=e75]: 📁
            - text: Sports
        - generic [ref=e76]:
          - status "Loading recommendations" [ref=e77]:
            - generic [ref=e78]:
              - img [ref=e79]
              - heading "AI Recommendations" [level=2] [ref=e84]
              - img [ref=e85]
          - status [ref=e87]:
            - generic [ref=e88]:
              - img [ref=e89]
              - heading "Recently Viewed" [level=2] [ref=e94]
              - img [ref=e95]
        - generic [ref=e97]:
          - generic [ref=e98]:
            - heading "Featured Products" [level=2] [ref=e99]
            - link "View All →" [ref=e100] [cursor=pointer]:
              - /url: /products
          - generic [ref=e101]:
            - 'link "iPhone 15 Pro Max 11% off iPhone 15 Pro Max Apple ₹1,59,900 ₹1,79,900 (0) #1 Best Seller Get it by Thu, 4 Jun FREE Delivery Add to Cart" [ref=e102] [cursor=pointer]':
              - /url: /products/iphone-15-pro-max
              - generic [ref=e103]:
                - generic [ref=e104]:
                  - img "iPhone 15 Pro Max" [ref=e105]
                  - generic [ref=e106]: 11% off
                  - button [ref=e107]:
                    - img [ref=e108]
                - generic [ref=e110]:
                  - heading "iPhone 15 Pro Max" [level=3] [ref=e111]
                  - paragraph [ref=e112]: Apple
                  - generic [ref=e113]:
                    - generic [ref=e114]: ₹1,59,900
                    - generic [ref=e115]: ₹1,79,900
                  - generic [ref=e117]: (0)
                  - generic [ref=e119]: "#1 Best Seller"
                  - generic [ref=e120]: Get it by Thu, 4 Jun
                  - generic [ref=e121]: FREE Delivery
                  - button "Add to Cart" [ref=e122]:
                    - img
                    - text: Add to Cart
            - link "Samsung Galaxy S24 Ultra 7% off Samsung Galaxy S24 Ultra Samsung ₹1,39,900 ₹1,49,900 (0) Get it by Mon, 8 Jun FREE Delivery Add to Cart" [ref=e123] [cursor=pointer]:
              - /url: /products/samsung-galaxy-s24-ultra
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - img "Samsung Galaxy S24 Ultra" [ref=e126]
                  - generic [ref=e127]: 7% off
                  - button [ref=e128]:
                    - img [ref=e129]
                - generic [ref=e131]:
                  - heading "Samsung Galaxy S24 Ultra" [level=3] [ref=e132]
                  - paragraph [ref=e133]: Samsung
                  - generic [ref=e134]:
                    - generic [ref=e135]: ₹1,39,900
                    - generic [ref=e136]: ₹1,49,900
                  - generic [ref=e138]: (0)
                  - generic [ref=e139]: Get it by Mon, 8 Jun
                  - generic [ref=e140]: FREE Delivery
                  - button "Add to Cart" [ref=e141]:
                    - img
                    - text: Add to Cart
            - 'link "MacBook Pro 14-inch M3 Pro 9% off MacBook Pro 14-inch M3 Pro Apple ₹1,99,900 ₹2,19,900 (0) #1 Best Seller Get it by Mon, 8 Jun FREE Delivery Add to Cart" [ref=e142] [cursor=pointer]':
              - /url: /products/macbook-pro-14-m3
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - img "MacBook Pro 14-inch M3 Pro" [ref=e145]
                  - generic [ref=e146]: 9% off
                  - button [ref=e147]:
                    - img [ref=e148]
                - generic [ref=e150]:
                  - heading "MacBook Pro 14-inch M3 Pro" [level=3] [ref=e151]
                  - paragraph [ref=e152]: Apple
                  - generic [ref=e153]:
                    - generic [ref=e154]: ₹1,99,900
                    - generic [ref=e155]: ₹2,19,900
                  - generic [ref=e157]: (0)
                  - generic [ref=e159]: "#1 Best Seller"
                  - generic [ref=e160]: Get it by Mon, 8 Jun
                  - generic [ref=e161]: FREE Delivery
                  - button "Add to Cart" [ref=e162]:
                    - img
                    - text: Add to Cart
            - 'link "Sony WH-1000XM5 14% off Sony WH-1000XM5 Sony ₹29,990 ₹34,990 (0) #1 Best Seller Get it by Mon, 8 Jun FREE Delivery Add to Cart" [ref=e163] [cursor=pointer]':
              - /url: /products/sony-wh-1000xm5
              - generic [ref=e164]:
                - generic [ref=e165]:
                  - img "Sony WH-1000XM5" [ref=e166]
                  - generic [ref=e167]: 14% off
                  - button [ref=e168]:
                    - img [ref=e169]
                - generic [ref=e171]:
                  - heading "Sony WH-1000XM5" [level=3] [ref=e172]
                  - paragraph [ref=e173]: Sony
                  - generic [ref=e174]:
                    - generic [ref=e175]: ₹29,990
                    - generic [ref=e176]: ₹34,990
                  - generic [ref=e178]: (0)
                  - generic [ref=e180]: "#1 Best Seller"
                  - generic [ref=e181]: Get it by Mon, 8 Jun
                  - generic [ref=e182]: FREE Delivery
                  - button "Add to Cart" [ref=e183]:
                    - img
                    - text: Add to Cart
            - 'link "Nike Air Max 270 13% off Nike Air Max 270 Nike ₹12,995 ₹14,995 (0) #1 Best Seller Get it by Wed, 3 Jun FREE Delivery Add to Cart" [ref=e184] [cursor=pointer]':
              - /url: /products/nike-air-max-270
              - generic [ref=e185]:
                - generic [ref=e186]:
                  - img "Nike Air Max 270" [ref=e187]
                  - generic [ref=e188]: 13% off
                  - button [ref=e189]:
                    - img [ref=e190]
                - generic [ref=e192]:
                  - heading "Nike Air Max 270" [level=3] [ref=e193]
                  - paragraph [ref=e194]: Nike
                  - generic [ref=e195]:
                    - generic [ref=e196]: ₹12,995
                    - generic [ref=e197]: ₹14,995
                  - generic [ref=e199]: (0)
                  - generic [ref=e201]: "#1 Best Seller"
                  - generic [ref=e202]: Get it by Wed, 3 Jun
                  - generic [ref=e203]: FREE Delivery
                  - button "Add to Cart" [ref=e204]:
                    - img
                    - text: Add to Cart
        - generic [ref=e205]:
          - generic [ref=e206]:
            - heading "Shop by Brand" [level=2] [ref=e207]
            - link "View All →" [ref=e208] [cursor=pointer]:
              - /url: /brands
          - generic [ref=e209]:
            - link "A Apple" [ref=e210] [cursor=pointer]:
              - /url: /brands/apple
              - generic [ref=e212]: A
              - generic [ref=e213]: Apple
            - link "S Samsung" [ref=e214] [cursor=pointer]:
              - /url: /brands/samsung
              - generic [ref=e216]: S
              - generic [ref=e217]: Samsung
            - link "S Sony" [ref=e218] [cursor=pointer]:
              - /url: /brands/sony
              - generic [ref=e220]: S
              - generic [ref=e221]: Sony
            - link "N Nike" [ref=e222] [cursor=pointer]:
              - /url: /brands/nike
              - generic [ref=e224]: "N"
              - generic [ref=e225]: Nike
            - link "A Adidas" [ref=e226] [cursor=pointer]:
              - /url: /brands/adidas
              - generic [ref=e228]: A
              - generic [ref=e229]: Adidas
            - link "L Levi's" [ref=e230] [cursor=pointer]:
              - /url: /brands/levis
              - generic [ref=e232]: L
              - generic [ref=e233]: Levi's
            - link "H HP" [ref=e234] [cursor=pointer]:
              - /url: /brands/hp
              - generic [ref=e236]: H
              - generic [ref=e237]: HP
            - link "D Dell" [ref=e238] [cursor=pointer]:
              - /url: /brands/dell
              - generic [ref=e240]: D
              - generic [ref=e241]: Dell
        - generic [ref=e242]:
          - heading "Shop by Category" [level=2] [ref=e243]
          - generic [ref=e244]:
            - link "Electronics 6 items" [ref=e245] [cursor=pointer]:
              - /url: /category/electronics
              - heading "Electronics" [level=3] [ref=e246]
              - paragraph [ref=e247]: 6 items
            - link "Fashion 0 items" [ref=e248] [cursor=pointer]:
              - /url: /category/fashion
              - heading "Fashion" [level=3] [ref=e249]
              - paragraph [ref=e250]: 0 items
            - link "Home & Kitchen 0 items" [ref=e251] [cursor=pointer]:
              - /url: /category/home-kitchen
              - heading "Home & Kitchen" [level=3] [ref=e252]
              - paragraph [ref=e253]: 0 items
            - link "Grocery 6 items" [ref=e254] [cursor=pointer]:
              - /url: /category/grocery
              - heading "Grocery" [level=3] [ref=e255]
              - paragraph [ref=e256]: 6 items
            - link "Beauty 2 items" [ref=e257] [cursor=pointer]:
              - /url: /category/beauty
              - heading "Beauty" [level=3] [ref=e258]
              - paragraph [ref=e259]: 2 items
            - link "Books 2 items" [ref=e260] [cursor=pointer]:
              - /url: /category/books
              - heading "Books" [level=3] [ref=e261]
              - paragraph [ref=e262]: 2 items
            - link "Toys & Games 1 items" [ref=e263] [cursor=pointer]:
              - /url: /category/toys-games
              - heading "Toys & Games" [level=3] [ref=e264]
              - paragraph [ref=e265]: 1 items
            - link "Sports 2 items" [ref=e266] [cursor=pointer]:
              - /url: /category/sports
              - heading "Sports" [level=3] [ref=e267]
              - paragraph [ref=e268]: 2 items
    - contentinfo [ref=e269]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e277] [cursor=pointer]:
    - img [ref=e278]
  - alert [ref=e282]
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