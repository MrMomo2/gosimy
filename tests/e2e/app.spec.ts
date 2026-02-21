import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('displays hero section', async ({ page }) => {
    await page.goto('/en');

    await expect(page.locator('h1')).toContainText('eSIM');
    await expect(page.getByRole('link', { name: /shop/i })).toBeVisible();
  });

  test('navigates to shop page', async ({ page }) => {
    await page.goto('/en');

    await page.click('a[href="/en/shop"]');
    await expect(page).toHaveURL('/en/shop');
    await expect(page.locator('h1')).toContainText('Browse');
  });

  test('shows featured destinations', async ({ page }) => {
    await page.goto('/en');

    const destinations = page.locator('[class*="grid"] a[href*="/shop/"]');
    await expect(destinations.first()).toBeVisible();
  });

  test('switches language', async ({ page }) => {
    await page.goto('/en');

    await page.click('button:has-text("EN")');
    await page.click('button:has-text("DE")');

    await expect(page).toHaveURL(/\/de/);
  });
});

test.describe('Shop Page', () => {
  test('displays country cards', async ({ page }) => {
    await page.goto('/en/shop');

    await expect(page.locator('text=destinations available')).toBeVisible();

    const cards = page.locator('a[href*="/shop/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('filters by region', async ({ page }) => {
    await page.goto('/en/shop');

    await page.click('button:has-text("Europe")');

    await expect(page).toHaveURL(/region=europe/);
  });

  test('searches destinations', async ({ page }) => {
    await page.goto('/en/shop');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Japan');

    await page.waitForTimeout(300);

    const results = page.locator('a[href*="/shop/"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Country Package Page', () => {
  test('displays packages for country', async ({ page }) => {
    await page.goto('/en/shop/US');

    await expect(page.locator('h1')).toContainText('United States');

    const packages = page.locator('button:has-text("Add to Cart")');
    await expect(packages.first()).toBeVisible();
  });

  test('adds package to cart', async ({ page }) => {
    await page.goto('/en/shop/US');

    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    await addToCartBtn.click();

    await expect(addToCartBtn).toContainText('Added');

    const cartBadge = page.locator('[class*="bg-blue-600"]');
    await expect(cartBadge).toBeVisible();
  });
});

test.describe('Cart', () => {
  test('opens cart drawer', async ({ page }) => {
    await page.goto('/en/shop/US');

    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.click('button[title="Cart"]');

    await expect(page.locator('text=Your Cart')).toBeVisible();
  });

  test('shows cart items', async ({ page }) => {
    await page.goto('/en/shop/US');

    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.click('button[title="Cart"]');

    await expect(page.locator('text=United States')).toBeVisible();
    await expect(page.locator('text=Proceed to Checkout')).toBeVisible();
  });

  test('removes item from cart', async ({ page }) => {
    await page.goto('/en/shop/US');

    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.click('button[title="Cart"]');

    await page.click('button:has-text("Remove")');

    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/en/auth/login');

    await expect(page.locator('h1')).toContainText('Sign');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows Google OAuth option', async ({ page }) => {
    await page.goto('/en/auth/login');

    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });
});

test.describe('Portal (Protected)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/en/portal');

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('SEO', () => {
  test('has correct meta tags', async ({ page }) => {
    await page.goto('/en');

    const title = await page.title();
    expect(title).toContain('Gosimy');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('has hreflang tags', async ({ page }) => {
    await page.goto('/en');

    const hreflang = page.locator('link[rel="alternate"][hreflang]');
    await expect(hreflang.first()).toBeVisible();
  });

  test('has canonical URL', async ({ page }) => {
    await page.goto('/en/shop');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeVisible();
  });
});
