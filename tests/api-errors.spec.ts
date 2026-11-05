import { test, expect } from '../fixtures/test-fixtures';
import { products, validCustomer } from '../fixtures/test-data';
import {
  ORDERS_API,
  PRODUCTS_API,
  delayResponse,
  failFirstRequests,
  mockMalformedJson,
  mockNetworkFailure,
  mockNoResponse,
  mockStatus,
} from '../utils/api-mocks';

test.describe('Search when the products API misbehaves', { tag: '@api-errors' }, () => {
  test('shows an error on 500 and recovers after "Try again"', async ({ shopPage, page }) => {
    const calls = await failFirstRequests(page, PRODUCTS_API, 500);
    await shopPage.goto();

    await expect(shopPage.errorBanner).toContainText("Couldn't load products.");
    await expect(shopPage.errorBanner).toContainText('Something went wrong on our side.');
    await expect(shopPage.productCards).toHaveCount(0);

    await shopPage.retryButton.click();

    await expect(shopPage.errorBanner).toBeHidden();
    await expect(shopPage.productCards).not.toHaveCount(0);
    expect(calls()).toBe(2);
  });

  test('retries the same query the user searched for', async ({ shopPage, page }) => {
    await shopPage.goto();
    await expect(shopPage.productCards).not.toHaveCount(0);

    await failFirstRequests(page, PRODUCTS_API, 503);
    await shopPage.search('kitchen');
    await expect(shopPage.errorBanner).toBeVisible();

    const retried = page.waitForRequest((req) => req.url().includes('/api/products?q=kitchen'));
    await shopPage.retryButton.click();
    await retried;

    await expect(shopPage.productCards).toHaveCount(2);
  });

  test('explains a dropped connection', async ({ shopPage, page }) => {
    await mockNetworkFailure(page, PRODUCTS_API);
    await shopPage.goto();

    await expect(shopPage.errorBanner).toContainText("Can't reach the store right now.");
  });

  test('handles rate limiting (429)', async ({ shopPage, page }) => {
    await mockStatus(page, PRODUCTS_API, 429, { error: 'Too Many Requests' });
    await shopPage.goto();

    await expect(shopPage.errorBanner).toContainText('Too many requests.');
  });

  test('does not crash on a non-JSON response', async ({ shopPage, page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    await mockMalformedJson(page, PRODUCTS_API);

    await shopPage.goto();

    await expect(shopPage.errorBanner).toContainText('The server sent an unexpected response.');
    expect(pageErrors).toEqual([]);
  });

  test('shows a loader while a slow request is in flight', async ({ shopPage, page }) => {
    await delayResponse(page, PRODUCTS_API, 1_500);
    await shopPage.goto();

    await expect(shopPage.loader).toBeVisible();
    await expect(shopPage.productCards.first()).toBeVisible({ timeout: 10_000 });
    await expect(shopPage.loader).toBeHidden();
  });

  test('gives up after 8 seconds without a response', async ({ shopPage, page }) => {
    // Fake timers let us skip the 8s wait instead of actually sitting through it
    await page.clock.install();
    await mockNoResponse(page, PRODUCTS_API);
    await shopPage.goto();
    await expect(shopPage.loader).toBeVisible();

    await page.clock.runFor(7_000);
    await expect(shopPage.errorBanner).toBeHidden();

    await page.clock.runFor(1_500);
    await expect(shopPage.errorBanner).toContainText('The store is taking too long to respond.');
    await expect(shopPage.loader).toBeHidden();
  });

  test('ignores a stale response that arrives after a newer search', async ({ shopPage, page }) => {
    await shopPage.goto();
    await expect(shopPage.productCards).not.toHaveCount(0);

    await page.route(PRODUCTS_API, async (route) => {
      if (route.request().url().includes('q=bags')) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
      await route.continue();
    });

    const slowBags = page.waitForResponse((res) => res.url().includes('q=bags'));
    await shopPage.search('bags');
    await shopPage.search('kitchen');
    await expect(shopPage.productCards).toHaveCount(2);

    await slowBags;
    await expect(shopPage.productNames).toHaveText(['Ceramic Pour-Over Coffee Set', 'Cast Iron Skillet 10"']);
  });
});

test.describe('Placing an order when the orders API misbehaves', { tag: '@api-errors' }, () => {
  test.beforeEach(async ({ seedCart, checkoutPage }) => {
    await seedCart([{ ...products.backpack, qty: 1 }]);
    await checkoutPage.goto();
    await checkoutPage.fill(validCustomer);
  });

  test('keeps the form and the cart when the server returns 503', async ({ checkoutPage, page }) => {
    await mockStatus(page, ORDERS_API, 503, { error: 'Service Unavailable' });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.formError).toHaveText(
      "We couldn't place your order. Something went wrong on our side. Please try again in a moment.",
    );
    await expect(checkoutPage.confirmation).toBeHidden();
    await expect(checkoutPage.submitButton).toBeEnabled();
    await expect(checkoutPage.submitButton).toHaveText('Place order');
    await expect(checkoutPage.field('email')).toHaveValue(validCustomer.email);
    await expect(checkoutPage.field('cardNumber')).toHaveValue(validCustomer.cardNumber);
    await expect(checkoutPage.cartBadge).toHaveText('1');
  });

  test('lets the user retry after a failure', async ({ checkoutPage, page }) => {
    await failFirstRequests(page, ORDERS_API, 500);

    await checkoutPage.placeOrder();
    await expect(checkoutPage.formError).toBeVisible();

    await checkoutPage.placeOrder();

    await expect(checkoutPage.confirmation).toBeVisible();
    await expect(checkoutPage.formError).toBeHidden();
  });

  test('explains a dropped connection', async ({ checkoutPage, page }) => {
    await mockNetworkFailure(page, ORDERS_API);
    await checkoutPage.placeOrder();

    await expect(checkoutPage.formError).toContainText("Can't reach the server.");
  });

  test('handles rate limiting (429)', async ({ checkoutPage, page }) => {
    await mockStatus(page, ORDERS_API, 429, { error: 'Too Many Requests' });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.formError).toContainText('Too many attempts.');
  });

  test('maps server-side field errors back onto the form', async ({ checkoutPage, page }) => {
    await mockStatus(page, ORDERS_API, 400, {
      error: 'Validation failed',
      errors: { zip: "We don't ship to this postal code yet" },
    });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.fieldError('zip')).toHaveText("We don't ship to this postal code yet");
    await expect(checkoutPage.field('zip')).toBeFocused();
    await expect(checkoutPage.formError).toHaveText(
      "We couldn't place your order. Please fix the highlighted fields.",
    );
  });

  test('times out instead of spinning forever', async ({ checkoutPage, page }) => {
    await page.clock.install();
    await mockNoResponse(page, ORDERS_API);

    await checkoutPage.placeOrder();
    await expect(checkoutPage.submitButton).toHaveText('Placing order...');

    await page.clock.runFor(8_500);

    await expect(checkoutPage.formError).toContainText('The server took too long to respond.');
    await expect(checkoutPage.submitButton).toBeEnabled();
  });

  test('sends only one order on a double click', async ({ checkoutPage, page }) => {
    let orderRequests = 0;
    page.on('request', (req) => {
      if (req.url().endsWith('/api/orders')) orderRequests++;
    });
    await delayResponse(page, ORDERS_API, 500);

    await checkoutPage.submitButton.dblclick();

    await expect(checkoutPage.submitButton).toBeDisabled();
    await expect(checkoutPage.confirmation).toBeVisible();
    expect(orderRequests).toBe(1);
  });
});
