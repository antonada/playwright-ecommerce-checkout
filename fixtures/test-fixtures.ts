import { test as base, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import type { CartSeedItem } from './test-data';

type ShopFixtures = {
  shopPage: ShopPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  seedCart: (items: CartSeedItem[]) => Promise<void>;
};

export const test = base.extend<ShopFixtures>({
  shopPage: async ({ page }, use) => {
    await use(new ShopPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // Puts items straight into localStorage so tests that care about the cart
  // or checkout don't have to click through the shop every time.
  seedCart: async ({ page }, use) => {
    await use(async (items) => {
      await page.addInitScript((serialized) => {
        // Init scripts run on every navigation. Seed only once per tab,
        // otherwise a reload would undo whatever the test changed.
        if (sessionStorage.getItem('cart-seeded')) return;
        localStorage.setItem('shop.cart', serialized);
        sessionStorage.setItem('cart-seeded', '1');
      }, JSON.stringify(items));
    });
  },
});

export { expect };
