import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartItemRow {
  readonly quantity: Locator;
  readonly lineTotal: Locator;
  readonly increaseButton: Locator;
  readonly decreaseButton: Locator;
  readonly removeButton: Locator;

  constructor(readonly root: Locator) {
    this.quantity = root.getByTestId('item-qty');
    this.lineTotal = root.getByTestId('item-total');
    this.increaseButton = root.getByRole('button', { name: 'Increase quantity' });
    this.decreaseButton = root.getByRole('button', { name: 'Decrease quantity' });
    this.removeButton = root.getByRole('button', { name: 'Remove' });
  }
}

export class CartPage extends BasePage {
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly emptyState: Locator;
  readonly checkoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('cart-item');
    this.subtotal = page.getByTestId('cart-subtotal');
    this.shipping = page.getByTestId('cart-shipping');
    this.total = page.getByTestId('cart-total');
    this.emptyState = page.getByTestId('empty-cart');
    this.checkoutLink = page.getByRole('link', { name: 'Proceed to checkout' });
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  item(name: string): CartItemRow {
    return new CartItemRow(this.items.filter({ has: this.page.getByRole('heading', { name, exact: true }) }));
  }
}
