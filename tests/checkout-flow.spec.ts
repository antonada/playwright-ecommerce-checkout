import { test, expect } from '../fixtures/test-fixtures';
import { products, validCustomer } from '../fixtures/test-data';

const { headphonesPro, waterBottle } = products;

test(
  'customer finds products, adjusts the cart and places an order',
  { tag: '@smoke' },
  async ({ shopPage, cartPage, checkoutPage, page }) => {
    await test.step('search and add two products', async () => {
      await shopPage.goto();
      await shopPage.search('headphones');
      await shopPage.addToCart(headphonesPro.name);

      await shopPage.search('bottle');
      await shopPage.addToCart(waterBottle.name);

      await expect(shopPage.cartBadge).toHaveText('2');
    });

    await test.step('review the cart and bump the quantity', async () => {
      await shopPage.cartLink.click();
      await expect(cartPage.items).toHaveCount(2);

      await cartPage.item(waterBottle.name).increaseButton.click();

      await expect(cartPage.item(waterBottle.name).quantity).toHaveText('2');
      await expect(cartPage.total).toHaveText('$177.00');
      await expect(cartPage.shipping).toHaveText('Free');
    });

    await test.step('fill in checkout details and pay', async () => {
      await cartPage.checkoutLink.click();
      await expect(checkoutPage.summaryTotal).toHaveText('$177.00');

      await checkoutPage.fill(validCustomer);

      const orderRequest = page.waitForRequest((req) => req.url().endsWith('/api/orders'));
      const orderResponse = page.waitForResponse((res) => res.url().endsWith('/api/orders'));
      await checkoutPage.placeOrder();

      const body = (await orderRequest).postDataJSON();
      expect(body.items).toEqual([
        { id: headphonesPro.id, qty: 1 },
        { id: waterBottle.id, qty: 2 },
      ]);
      expect(body.customer.email).toBe(validCustomer.email);

      const response = await orderResponse;
      expect(response.status()).toBe(201);
      expect(await response.json()).toMatchObject({ total: 17700, shipping: 0 });
    });

    await test.step('see the confirmation and an empty cart', async () => {
      await expect(checkoutPage.confirmation).toBeVisible();
      await expect(checkoutPage.orderNumber).toHaveText(/^ORD-\d+$/);
      await expect(checkoutPage.confirmationEmail).toHaveText(validCustomer.email);
      await expect(checkoutPage.cartBadge).toHaveText('0');

      await checkoutPage.cartLink.click();
      await expect(cartPage.emptyState).toBeVisible();
    });
  },
);
