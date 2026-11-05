import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ShopPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly loader: Locator;
  readonly resultsSummary: Locator;
  readonly emptyResults: Locator;
  readonly errorBanner: Locator;
  readonly retryButton: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox', { name: 'Search products' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.productCards = page.getByTestId('product-card');
    this.productNames = this.productCards.getByRole('heading');
    this.loader = page.getByTestId('loader');
    this.resultsSummary = page.getByTestId('results-summary');
    this.emptyResults = page.getByTestId('empty-results');
    this.errorBanner = page.getByTestId('error-banner');
    this.retryButton = this.errorBanner.getByRole('button', { name: 'Try again' });
    this.toast = page.getByTestId('toast');
  }

  async goto(query?: string) {
    await this.page.goto(query === undefined ? '/' : `/?q=${encodeURIComponent(query)}`);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  productCard(name: string): Locator {
    return this.productCards.filter({
      has: this.page.getByRole('heading', { name, exact: true }),
    });
  }

  async addToCart(name: string) {
    await this.productCard(name).getByRole('button', { name: 'Add to cart' }).click();
  }
}
