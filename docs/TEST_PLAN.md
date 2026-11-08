# Test plan

## Scope

The app under test is the small shop in `app/`: product search, a cart stored in `localStorage`, and a checkout form that posts to `POST /api/orders`. The goal is to cover what a real customer does, plus the ways the backend can let them down.

Out of scope: real payments, auth, performance and load testing.

## Approach

- UI tests run in Chromium, Firefox, WebKit and a Pixel 7 viewport.
- API tests hit the Express server directly with Playwright's `request` fixture, no browser involved.
- Backend failures are simulated in the browser with `page.route()`. The real server stays untouched, so every failure case is predictable and fast.
- Timeouts use `page.clock` to skip ahead instead of waiting 8 real seconds.
- Each test gets a fresh browser context. Tests that need a filled cart seed it through `localStorage` rather than clicking through the shop.

## Test cases

### Search (`tests/search.spec.ts`)

| ID      | Case                                             | Tags   |
| ------- | ------------------------------------------------ | ------ |
| SRCH-01 | Full catalog is listed before any search         |        |
| SRCH-02 | Search by product name                           | @smoke |
| SRCH-03 | Search ignores letter case                       |        |
| SRCH-04 | Partial word matches ("head" finds the headlamp) |        |
| SRCH-05 | Search by category                               |        |
| SRCH-06 | No results shows a helpful message               |        |
| SRCH-07 | Whitespace-only query behaves like an empty one  |        |
| SRCH-08 | HTML in the query is rendered as text (no XSS)   |        |
| SRCH-09 | Search query is restored from the URL            |        |

### Cart (`tests/cart.spec.ts`)

| ID      | Case                                                 | Tags   |
| ------- | ---------------------------------------------------- | ------ |
| CART-01 | Adding a product updates the badge and shows a toast | @smoke |
| CART-02 | Adding the same product twice increases quantity     |        |
| CART-03 | Line total, subtotal, shipping and total recalculate |        |
| CART-04 | Order of exactly $100 gets free shipping (boundary)  |        |
| CART-05 | Quantity can't go below 1                            |        |
| CART-06 | Quantity is capped at 10                             |        |
| CART-07 | Removing the last item shows the empty state         |        |
| CART-08 | Cart survives a page reload                          |        |
| CART-09 | Checkout shows an empty state when the cart is empty |        |

### Checkout validation (`tests/checkout-validation.spec.ts`)

| ID     | Case                                                                    | Tags   |
| ------ | ----------------------------------------------------------------------- | ------ |
| CHK-01 | Empty form flags all 9 required fields, no request is sent              | @smoke |
| CHK-02 | Invalid values are rejected, one field at a time (14 data-driven cases) |        |
| CHK-03 | Focus moves to the first invalid field                                  |        |
| CHK-04 | Error appears when leaving an invalid field                             |        |
| CHK-05 | Error clears once the value is fixed                                    |        |
| CHK-06 | A card expiring this month is still accepted (boundary)                 |        |
| CHK-07 | Card numbers with dashes are accepted                                   |        |

Values covered by CHK-02: short name, two broken emails, letters in phone, too-short phone, short address, short postal code, too-short card number, card failing the Luhn check, month 13, missing slash in expiry, expired card, 2-digit CVV, non-numeric CVV.

### API failures (`tests/api-errors.spec.ts`, tag `@api-errors`)

| ID     | Endpoint            | Simulated problem                        | Expected behaviour                              |
| ------ | ------------------- | ---------------------------------------- | ----------------------------------------------- |
| ERR-01 | `GET /api/products` | 500, then success                        | Error banner, "Try again" recovers              |
| ERR-02 | `GET /api/products` | 503 on a specific search                 | Retry repeats the same query                    |
| ERR-03 | `GET /api/products` | Connection dropped                       | "Can't reach the store" message                 |
| ERR-04 | `GET /api/products` | 429 Too Many Requests                    | Rate limit message                              |
| ERR-05 | `GET /api/products` | 200 with an HTML body                    | Friendly error, no uncaught JS errors           |
| ERR-06 | `GET /api/products` | Slow response (1.5s)                     | Loader shown, then results                      |
| ERR-07 | `GET /api/products` | No response at all                       | Gives up after 8s with a timeout message        |
| ERR-08 | `GET /api/products` | Older request finishes after a newer one | Stale results are ignored                       |
| ERR-09 | `POST /api/orders`  | 503                                      | Form data and cart kept, button enabled again   |
| ERR-10 | `POST /api/orders`  | 500, then success                        | Second attempt places the order                 |
| ERR-11 | `POST /api/orders`  | Connection dropped                       | Connection message                              |
| ERR-12 | `POST /api/orders`  | 429                                      | Rate limit message                              |
| ERR-13 | `POST /api/orders`  | 400 with field errors                    | Errors mapped to fields, focus on the first one |
| ERR-14 | `POST /api/orders`  | No response at all                       | Times out, button enabled again                 |
| ERR-15 | `POST /api/orders`  | Slow response + double click             | Exactly one order request is sent               |

### End to end (`tests/checkout-flow.spec.ts`)

| ID     | Case                                                                                       | Tags   |
| ------ | ------------------------------------------------------------------------------------------ | ------ |
| E2E-01 | Search, add two products, change quantity, check out, verify request body and confirmation | @smoke |

### API (`tests/api/*.api.spec.ts`, tag `@api`)

| ID     | Case                                                                  |
| ------ | --------------------------------------------------------------------- |
| API-01 | `GET /api/products` returns the catalog with the right shape          |
| API-02 | Query filter ignores case and surrounding spaces                      |
| API-03 | No matches returns 200 with an empty list                             |
| API-04 | Unknown product id returns 404                                        |
| API-05 | Valid order returns 201, totals come from the catalog, not the client |
| API-06 | Free shipping applies from $100                                       |
| API-07 | Invalid customer data returns 400 with per-field errors               |
| API-08 | Empty cart, unknown product, qty 0 and qty 11 are rejected            |

## Test data

- Product catalog is fixed (`app/data/products.json`), so expected names and prices never drift.
- Card numbers are standard test numbers (`4242 4242 4242 4242`, `5555 5555 5555 4444`).
- Expiry dates are calculated relative to today, so the suite doesn't start failing when a hardcoded date passes.

## Exit criteria

- All tests green in all four browser projects and the API project.
- No retries needed locally (`--repeat-each=3` passes).
- Lint passes.
