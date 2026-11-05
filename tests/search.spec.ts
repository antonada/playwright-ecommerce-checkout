import { test, expect } from '../fixtures/test-fixtures';
import { CATALOG_SIZE } from '../fixtures/test-data';

test.describe('Product search', () => {
  test('lists the whole catalog before any search', async ({ shopPage }) => {
    await shopPage.goto();

    await expect(shopPage.productCards).toHaveCount(CATALOG_SIZE);
    await expect(shopPage.resultsSummary).toHaveText(`${CATALOG_SIZE} products`);
  });

  test('finds products by name', { tag: '@smoke' }, async ({ shopPage, page }) => {
    await shopPage.goto();
    await shopPage.search('headphones');

    await expect(shopPage.productNames).toHaveText(['Wireless Headphones Pro', 'Studio Headphones']);
    await expect(shopPage.resultsSummary).toHaveText('2 products');
    await expect(page).toHaveURL(/\?q=headphones$/);
  });

  test('ignores letter case', async ({ shopPage }) => {
    await shopPage.goto();
    await shopPage.search('HeAdPhOnEs');

    await expect(shopPage.productCards).toHaveCount(2);
  });

  test('matches part of a word', async ({ shopPage }) => {
    await shopPage.goto();
    await shopPage.search('head');

    // "head" also hits the headlamp, which is what a real shopper would expect
    await expect(shopPage.productNames).toHaveText([
      'Wireless Headphones Pro',
      'Studio Headphones',
      'Camping Headlamp',
    ]);
  });

  test('finds products by category', async ({ shopPage }) => {
    await shopPage.goto();
    await shopPage.search('kitchen');

    await expect(shopPage.productNames).toHaveText(['Ceramic Pour-Over Coffee Set', 'Cast Iron Skillet 10"']);
  });

  test('shows a helpful message when nothing matches', async ({ shopPage }) => {
    await shopPage.goto();
    await shopPage.search('unicorn saddle');

    await expect(shopPage.emptyResults).toHaveText(
      'No products match "unicorn saddle". Try a different search.',
    );
    await expect(shopPage.productCards).toHaveCount(0);
  });

  test('treats a whitespace-only query as an empty search', async ({ shopPage }) => {
    await shopPage.goto('bags');
    await expect(shopPage.productCards).toHaveCount(3);

    await shopPage.search('    ');

    await expect(shopPage.productCards).toHaveCount(CATALOG_SIZE);
    await expect(shopPage.emptyResults).toBeHidden();
  });

  test('renders HTML in the query as plain text', async ({ shopPage, page }) => {
    const payload = '<img src=x onerror="window.__xss = true">';
    await shopPage.goto();
    await shopPage.search(payload);

    await expect(shopPage.emptyResults).toContainText(payload);
    await expect(shopPage.emptyResults.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss)).toBeUndefined();
  });

  test('restores the search from the URL', async ({ shopPage }) => {
    await shopPage.goto('bags');

    await expect(shopPage.searchInput).toHaveValue('bags');
    await expect(shopPage.productCards).toHaveCount(3);
  });
});
