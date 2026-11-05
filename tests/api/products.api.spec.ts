import { test, expect } from '@playwright/test';
import { CATALOG_SIZE, products } from '../../fixtures/test-data';

test.describe('GET /api/products', { tag: '@api' }, () => {
  test('returns the full catalog', async ({ request }) => {
    const response = await request.get('/api/products');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(CATALOG_SIZE);
    expect(body.items).toHaveLength(CATALOG_SIZE);
    for (const item of body.items) {
      expect(item).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        price: expect.any(Number),
        stock: expect.any(Number),
      });
    }
  });

  test('filters by query, ignoring case and surrounding spaces', async ({ request }) => {
    const response = await request.get('/api/products', { params: { q: '  STUDIO ' } });
    const body = await response.json();

    expect(body.items.map((p: { id: string }) => p.id)).toEqual([products.studioHeadphones.id]);
  });

  test('returns an empty list, not an error, when nothing matches', async ({ request }) => {
    const response = await request.get('/api/products', { params: { q: 'zzz' } });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ items: [], total: 0 });
  });

  test('returns 404 for an unknown product id', async ({ request }) => {
    const response = await request.get('/api/products/p-999');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'Product not found' });
  });
});
