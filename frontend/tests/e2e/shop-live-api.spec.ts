import { expect, test } from '@playwright/test';

test.describe('live api smoke', () => {
  test.skip(
    process.env.PLAYWRIGHT_LIVE_API !== 'true',
    'Set PLAYWRIGHT_LIVE_API=true to run against the local backend.',
  );

  test('shop page calls the real local API', async ({ page }) => {
    const productsResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/cshop/products') &&
        response.request().method() === 'GET',
    );

    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Résultats Boutique' })).toBeVisible();

    const response = await productsResponse;
    expect(response.ok()).toBeTruthy();
  });
});
