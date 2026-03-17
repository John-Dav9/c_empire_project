import { BrowserContext, expect, Page, test } from '@playwright/test';

function createFakeJwt(role = 'client'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'e2e-user',
      email: 'e2e@cempire.com',
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  ).toString('base64url');
  return `${header}.${payload}.signature`;
}

async function installApiMocks(context: BrowserContext): Promise<void> {
  let cartState = {
    id: 'cart-1',
    totalAmount: 0,
    items: [] as Array<{
      id: string;
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>,
  };

  await context.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;
    let body: Record<string, unknown> | undefined;
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      try {
        body = route.request().postDataJSON() as Record<string, unknown>;
      } catch {
        body = undefined;
      }
    }
    const jsonHeaders = {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'Content-Type,Authorization',
    };

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: jsonHeaders,
      });
      return;
    }

    if (pathname.startsWith('/api/cshop/products') && method === 'GET') {
      if (pathname === '/api/cshop/products/prod-1') {
        await route.fulfill({
          status: 200,
          headers: jsonHeaders,
          body: JSON.stringify({
            id: 'prod-1',
            name: 'CShop Test Produit',
            description: 'Produit E2E',
            price: 12000,
            stock: 10,
            isActive: true,
            categories: ['Maison'],
            images: ['/uploads/products/test-product.jpg'],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          data: [
            {
              id: 'prod-1',
              name: 'CShop Test Produit',
              description: 'Produit E2E',
              price: 12000,
              finalPrice: 12000,
              stock: 10,
              isActive: true,
              categories: ['Maison'],
              images: ['/uploads/products/test-product.jpg'],
              avgRating: 4.5,
              reviewsCount: 8,
              sku: 'CSH-E2E-001',
            },
          ],
          total: 1,
          page: 1,
          limit: 500,
        }),
      });
      return;
    }

    if (pathname.startsWith('/api/cshop/reviews/product/') && method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname === '/api/cshop/cart/clear' && method === 'DELETE') {
      cartState = { ...cartState, totalAmount: 0, items: [] };
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify(cartState),
      });
      return;
    }

    if (
      pathname.startsWith('/api/cshop/cart') &&
      method === 'GET' &&
      !pathname.includes('/item/') &&
      pathname !== '/api/cshop/cart/clear'
    ) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify(cartState),
      });
      return;
    }

    if (pathname === '/api/cshop/cart/add' && method === 'POST') {
      const productId = String(body?.productId || '');
      const quantity = Number(body?.quantity || 1);
      const existing = cartState.items.find((item) => item.productId === productId);

      if (existing) {
        existing.quantity += quantity;
      } else {
        cartState.items.push({
          id: `cart-item-${cartState.items.length + 1}`,
          productId,
          productName: 'CShop Test Produit',
          unitPrice: 12000,
          quantity,
        });
      }

      cartState.totalAmount = cartState.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      await route.fulfill({
        status: 201,
        headers: jsonHeaders,
        body: JSON.stringify(cartState),
      });
      return;
    }

    if (pathname === '/api/cshop/orders/checkout' && method === 'POST') {
      const selectedIds = Array.isArray(body?.cartItemIds)
        ? body!.cartItemIds.map((value) => String(value))
        : cartState.items.map((item) => item.id);
      cartState.items = cartState.items.filter((item) => !selectedIds.includes(item.id));
      cartState.totalAmount = cartState.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      await route.fulfill({
        status: 201,
        headers: jsonHeaders,
        body: JSON.stringify({ id: 'order-e2e-1' }),
      });
      return;
    }

    if (pathname === '/api/payments/init' && method === 'POST') {
      await route.fulfill({
        status: 201,
        headers: jsonHeaders,
        body: JSON.stringify({
          paymentId: 'pay-e2e-1',
          providerTransactionId: 'txn-e2e-1',
          amount: 17000,
          currency: 'XAF',
          instructions: 'mock verify',
          redirectUrl: null,
        }),
      });
      return;
    }

    if (pathname === '/api/payments/verify' && method === 'POST') {
      await route.fulfill({
        status: 201,
        headers: jsonHeaders,
        body: JSON.stringify({
          status: 'SUCCESS',
        }),
      });
      return;
    }

    if (pathname.startsWith('/api/cshop/promotions/public/code/') && method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ valid: false }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });
}

test.beforeEach(async ({ page, context }) => {
  const token = createFakeJwt('client');
  await page.addInitScript((accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('checkoutCartItemIds');
  }, token);

  await installApiMocks(context);
});

test('parcours boutique complet: listing -> detail -> panier -> paiement', async ({
  page,
}) => {
  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: 'Résultats Boutique' })).toBeVisible();
  await expect(page.getByText('CShop Test Produit').first()).toBeVisible({ timeout: 10000 });

  await page
    .locator('mat-card', { hasText: 'CShop Test Produit' })
    .getByRole('button', { name: 'Détails' })
    .click();

  await expect(page).toHaveURL(/\/shop\/product\/prod-1$/);
  await expect(page.getByRole('heading', { name: 'CShop Test Produit' })).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter au panier' }).click();
  await expect(page).toHaveURL(/\/shop\/cart$/);
  await expect(
    page.locator('.item-name', { hasText: 'CShop Test Produit' }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Payer maintenant' }).click();
  await expect(page).toHaveURL(/\/payments\/checkout/);

  await page.getByLabel('Email').fill('buyer@cempire.com');
  await page.getByLabel('Téléphone').fill('+237690000000');
  await page.getByLabel('Adresse').fill('Rue 123, Bonapriso');
  await page.getByLabel('Ville').fill('Douala');

  await page.getByRole('button', { name: 'Carte Bancaire' }).click();
  await page.getByRole('button', { name: 'Commander et payer' }).click();

  await expect(page.getByText('Paiement effectué avec succès.')).toBeVisible();
});

test('retour stripe: validation session_id et nettoyage checkout', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('checkoutCartItemIds', JSON.stringify(['cart-item-1']));
  });

  await page.goto('/payments/checkout?status=success&session_id=cs_test_123');
  await expect(page.getByText('Paiement effectué avec succès.')).toBeVisible();

  const selectionAfter = await page.evaluate(() =>
    sessionStorage.getItem('checkoutCartItemIds'),
  );
  expect(selectionAfter).toBe(null);
});
