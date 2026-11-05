import { test, expect } from '../fixtures/test-fixtures';
import { products } from '../fixtures/test-data';
import { usdFromCents } from '../utils/money';

const { backpack, headlamp, waterBottle, skillet, coffeeSet } = products;

test.describe('Cart', () => {
  test('adding a product updates the badge and confirms it', { tag: '@smoke' }, async ({ shopPage }) => {
    await shopPage.goto();
    await expect(shopPage.cartBadge).toHaveText('0');

    await shopPage.addToCart(backpack.name);

    await expect(shopPage.cartBadge).toHaveText('1');
    await expect(shopPage.toast).toHaveText(`${backpack.name} added to cart`);
  });

  test('adding the same product twice bumps its quantity instead of duplicating it', async ({
    shopPage,
    cartPage,
  }) => {
    await shopPage.goto();
    await shopPage.addToCart(backpack.name);
    await shopPage.addToCart(backpack.name);
    await expect(shopPage.cartBadge).toHaveText('2');

    await shopPage.cartLink.click();

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.item(backpack.name).quantity).toHaveText('2');
  });

  test('recalculates line and order totals when quantity changes', async ({ seedCart, cartPage }) => {
    await seedCart([
      { ...backpack, qty: 1 },
      { ...headlamp, qty: 1 },
    ]);
    await cartPage.goto();

    // $69.00 + $19.50 is under the free shipping threshold
    await expect(cartPage.subtotal).toHaveText('$88.50');
    await expect(cartPage.shipping).toHaveText('$7.50');
    await expect(cartPage.total).toHaveText('$96.00');

    const row = cartPage.item(backpack.name);
    await row.increaseButton.click();

    await expect(row.quantity).toHaveText('2');
    await expect(row.lineTotal).toHaveText(usdFromCents(backpack.price * 2));
    await expect(cartPage.subtotal).toHaveText('$157.50');
    await expect(cartPage.shipping).toHaveText('Free');
    await expect(cartPage.total).toHaveText('$157.50');
    await expect(cartPage.cartBadge).toHaveText('3');
  });

  test('gives free shipping on an order of exactly $100', async ({ seedCart, cartPage }) => {
    await seedCart([
      { ...waterBottle, qty: 1 },
      { ...skillet, qty: 1 },
      { ...coffeeSet, qty: 1 },
    ]);
    await cartPage.goto();

    await expect(cartPage.subtotal).toHaveText('$100.00');
    await expect(cartPage.shipping).toHaveText('Free');
    await expect(cartPage.total).toHaveText('$100.00');
  });

  test('does not let quantity drop below 1', async ({ seedCart, cartPage }) => {
    await seedCart([{ ...backpack, qty: 2 }]);
    await cartPage.goto();

    const row = cartPage.item(backpack.name);
    await row.decreaseButton.click();

    await expect(row.quantity).toHaveText('1');
    await expect(row.decreaseButton).toBeDisabled();
  });

  test('caps quantity at 10 per product', async ({ seedCart, cartPage }) => {
    await seedCart([{ ...headlamp, qty: 9 }]);
    await cartPage.goto();

    const row = cartPage.item(headlamp.name);
    await row.increaseButton.click();

    await expect(row.quantity).toHaveText('10');
    await expect(row.increaseButton).toBeDisabled();
  });

  test('removing the last item shows the empty cart', async ({ seedCart, cartPage }) => {
    await seedCart([{ ...backpack, qty: 1 }]);
    await cartPage.goto();

    await cartPage.item(backpack.name).removeButton.click();

    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.emptyState).toContainText('Your cart is empty.');
    await expect(cartPage.checkoutLink).toBeHidden();
    await expect(cartPage.cartBadge).toHaveText('0');
  });

  test('keeps the cart after a page reload', async ({ shopPage, cartPage, page }) => {
    await shopPage.goto();
    await shopPage.addToCart(headlamp.name);
    await expect(shopPage.cartBadge).toHaveText('1');

    await cartPage.goto();
    await page.reload();

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.item(headlamp.name).quantity).toHaveText('1');
  });

  test('checkout is not available with an empty cart', async ({ checkoutPage }) => {
    await checkoutPage.goto();

    await expect(checkoutPage.emptyState).toBeVisible();
    await expect(checkoutPage.form).toBeHidden();
  });
});
