import type { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(readonly page: Page) {
    this.cartBadge = page.getByTestId('cart-count');
    this.cartLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /cart/i });
  }
}
