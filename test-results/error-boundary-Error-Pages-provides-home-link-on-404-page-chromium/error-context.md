# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-boundary.spec.ts >> Error Pages >> provides home link on 404 page
- Location: src/tests/e2e/error-boundary.spec.ts:10:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/"
Received: "http://localhost:3000/this-page-does-not-exist-12345"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/this-page-does-not-exist-12345"

```

```yaml
- heading "404" [level=1]
- paragraph: Page not found
- link "Go Home":
  - /url: /
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Error Pages", () => {
  4  |   test("shows 404 for unknown routes", async ({ page }) => {
  5  |     await page.goto("/this-page-does-not-exist-12345");
  6  |     await expect(page.locator("text=404")).toBeVisible({ timeout: 5000 });
  7  |     await expect(page.locator("text=Page not found")).toBeVisible();
  8  |   });
  9  | 
  10 |   test("provides home link on 404 page", async ({ page }) => {
  11 |     await page.goto("/this-page-does-not-exist-12345");
  12 |     const homeLink = page.locator("a:has-text('Go Home')");
  13 |     await expect(homeLink).toBeVisible();
  14 |     await homeLink.click();
> 15 |     await expect(page).toHaveURL("/");
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  16 |   });
  17 | });
  18 | 
```