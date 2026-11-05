import type { Page, Route } from '@playwright/test';

export const PRODUCTS_API = '**/api/products*';
export const ORDERS_API = '**/api/orders';

export async function mockStatus(page: Page, url: string, status: number, body: object = {}) {
  await page.route(url, (route) => route.fulfill({ status, json: body }));
}

export async function mockNetworkFailure(page: Page, url: string) {
  await page.route(url, (route) => route.abort('failed'));
}

export async function mockMalformedJson(page: Page, url: string) {
  await page.route(url, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Bad gateway</body></html>' }),
  );
}

/** Leaves the request hanging forever. Pair with page.clock to trigger the app's timeout. */
export async function mockNoResponse(page: Page, url: string) {
  await page.route(url, () => {});
}

export async function delayResponse(page: Page, url: string, ms: number) {
  await page.route(url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

/**
 * Fails the first `times` requests with the given status and lets the rest through.
 * Returns a getter for how many requests were seen, handy for retry assertions.
 */
export async function failFirstRequests(page: Page, url: string, status: number, times = 1) {
  let calls = 0;
  await page.route(url, async (route: Route) => {
    calls++;
    if (calls <= times) {
      await route.fulfill({ status, json: { error: 'Simulated failure' } });
    } else {
      await route.continue();
    }
  });
  return () => calls;
}
