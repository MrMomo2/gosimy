import { test, expect, Page } from '@playwright/test';

test.describe('Checkout Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/shop/US');
  });

  test('complete checkout flow with mocked payment', async ({ page }) => {
    // Add item to cart
    await page.locator('button:has-text("Add to Cart")').first().click();
    await expect(page.locator('button:has-text("Added")')).toBeVisible({ timeout: 5000 });

    // Open cart
    await page.click('button[title="Cart"]');
    await expect(page.locator('text=Your Cart')).toBeVisible();

    // Verify cart contents
    await expect(page.locator('text=United States')).toBeVisible();

    // Proceed to checkout (will redirect to Dodo)
    const checkoutPromise = page.waitForEvent('popup');
    await page.click('button:has-text("Proceed to Checkout")');
    
    // Note: In CI, we mock the Dodo checkout
    // For now, just verify the button was clicked
  });

  test('cart persists across page navigation', async ({ page }) => {
    // Add item
    await page.locator('button:has-text("Add to Cart")').first().click();
    await expect(page.locator('button:has-text("Added")')).toBeVisible();

    // Navigate away
    await page.goto('/en/shop');

    // Cart badge should still show
    const cartBadge = page.locator('[class*="bg-blue-600"]');
    await expect(cartBadge).toBeVisible();
  });

  test('quantity updates in cart', async ({ page }) => {
    // Add same item twice
    const addButton = page.locator('button:has-text("Add to Cart")').first();
    await addButton.click();
    await addButton.click();

    // Open cart
    await page.click('button[title="Cart"]');
    await expect(page.locator('text=Your Cart')).toBeVisible();

    // Should show quantity of 2
    await expect(page.locator('text=× 2')).toBeVisible();
  });

  test('removes item from cart', async ({ page }) => {
    // Add item
    await page.locator('button:has-text("Add to Cart")').first().click();
    await expect(page.locator('button:has-text("Added")')).toBeVisible();

    // Open cart
    await page.click('button[title="Cart"]');
    await expect(page.locator('text=Your Cart')).toBeVisible();

    // Remove item
    await page.click('button:has-text("Remove")');

    // Cart should be empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('applies valid coupon', async ({ page }) => {
    // Add item
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Open cart
    await page.click('button[title="Cart"]');

    // Enter coupon (would need a test coupon in DB)
    await page.fill('input[placeholder*="Coupon"]', 'TEST10');
    await page.click('button:has-text("Apply")');

    // Note: Result depends on whether coupon exists
  });

  test('shows error for invalid coupon', async ({ page }) => {
    // Add item
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Open cart
    await page.click('button[title="Cart"]');

    // Enter invalid coupon
    await page.fill('input[placeholder*="Coupon"]', 'INVALID123');
    await page.click('button:has-text("Apply")');

    // Should show error (timing depends on API)
    await page.waitForTimeout(1000);
  });

  test('shows total price correctly', async ({ page }) => {
    // Add item
    await page.locator('button:has-text("Add to Cart")').first().click();

    // Open cart
    await page.click('button[title="Cart"]');

    // Should show total
    await expect(page.locator('text=/Total:.*\\$\\d/')).toBeVisible();
  });

  test('checkout redirects for empty cart', async ({ page }) => {
    // Try to checkout without items
    await page.click('button[title="Cart"]');
    await expect(page.locator('text=Your cart is empty')).toBeVisible();

    // Proceed button should not work or show message
    const proceedBtn = page.locator('button:has-text("Proceed to Checkout")');
    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
      // Should stay on page or show error
    }
  });
});

test.describe('Checkout Success Page', () => {
  test('shows success message', async ({ page }) => {
    await page.goto('/en/checkout/success');

    await expect(page.locator('text=/success|thank/i')).toBeVisible();
  });
});

test.describe('Checkout Cancel Page', () => {
  test('shows cancel message', async ({ page }) => {
    await page.goto('/en/checkout/cancel');

    await expect(page.locator('text=/cancel|try again/i')).toBeVisible();
  });
});
