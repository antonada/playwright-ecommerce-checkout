import { test, expect } from '@playwright/test';
import { products, validCustomer } from '../../fixtures/test-data';

const { backpack, headlamp } = products;

test.describe('POST /api/orders', { tag: '@api' }, () => {
  test('creates an order and calculates totals on the server', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        customer: validCustomer,
        // A tampered price from the client should be ignored
        items: [{ id: backpack.id, qty: 1, price: 1 }],
      },
    });

    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual({
      orderId: expect.stringMatching(/^ORD-\d+$/),
      subtotal: 6900,
      shipping: 750,
      total: 7650,
    });
  });

  test('applies free shipping from $100', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: { customer: validCustomer, items: [{ id: headlamp.id, qty: 6 }] },
    });

    expect(await response.json()).toMatchObject({ subtotal: 11700, shipping: 0, total: 11700 });
  });

  test('rejects an invalid customer with per-field errors', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        customer: { ...validCustomer, email: 'nope', cvv: '' },
        items: [{ id: backpack.id, qty: 1 }],
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Validation failed',
      errors: {
        email: 'Enter a valid email address',
        cvv: 'CVV is required',
      },
    });
  });

  const badCarts = [
    { title: 'an empty cart', items: [], error: 'Cart is empty' },
    { title: 'an unknown product', items: [{ id: 'p-999', qty: 1 }], error: 'Unknown product: p-999' },
    {
      title: 'a zero quantity',
      items: [{ id: backpack.id, qty: 0 }],
      error: `Invalid quantity for ${backpack.name}`,
    },
    {
      title: 'more than 10 of one item',
      items: [{ id: backpack.id, qty: 11 }],
      error: `Invalid quantity for ${backpack.name}`,
    },
  ];

  for (const { title, items, error } of badCarts) {
    test(`rejects ${title}`, async ({ request }) => {
      const response = await request.post('/api/orders', { data: { customer: validCustomer, items } });

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error });
    });
  }
});
