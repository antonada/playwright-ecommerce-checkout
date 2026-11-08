# Test report

Latest full run on GitHub Actions. The interactive HTML report (steps, traces, screenshots) is published at
https://antonada.github.io/playwright-ecommerce-checkout/, and every run is listed on the
[Actions page](https://github.com/antonada/playwright-ecommerce-checkout/actions/workflows/playwright.yml).

## Summary

|              |                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Date         | 8 November 2026                                                                                    |
| Commit       | `bcbd01d`                                                                                          |
| CI run       | [#42493944558](https://github.com/antonada/playwright-ecommerce-checkout/actions/runs/42493944558) |
| Environment  | GitHub Actions, `ubuntu-26.04`, Node 22, Playwright 1.63, 2 workers                                |
| Result       | **227 passed**, 0 failed, 0 flaky, 0 skipped                                                       |
| Duration     | 1.7 min for the test step                                                                          |
| Retries used | none                                                                                               |

## Results by project

| Project       | Browser / client     |   Tests |  Passed | Failed |
| ------------- | -------------------- | ------: | ------: | -----: |
| api           | Playwright `request` |      11 |      11 |      0 |
| chromium      | Desktop Chrome       |      54 |      54 |      0 |
| firefox       | Desktop Firefox      |      54 |      54 |      0 |
| webkit        | Desktop Safari       |      54 |      54 |      0 |
| mobile-chrome | Pixel 7              |      54 |      54 |      0 |
| **Total**     |                      | **227** | **227** |  **0** |

## Results by area

Counts are per browser project, except the API tests which run once.

| Area                | Spec                                | Tests | Status |
| ------------------- | ----------------------------------- | ----: | ------ |
| Search              | `tests/search.spec.ts`              |     9 | Passed |
| Cart                | `tests/cart.spec.ts`                |     9 | Passed |
| Checkout validation | `tests/checkout-validation.spec.ts` |    20 | Passed |
| API failures        | `tests/api-errors.spec.ts`          |    15 | Passed |
| End to end          | `tests/checkout-flow.spec.ts`       |     1 | Passed |
| API                 | `tests/api/*.api.spec.ts`           |    11 | Passed |

Case IDs and descriptions are in the [test plan](TEST_PLAN.md).

## Stability

Before the first push the suite was run locally three times in a row (`--repeat-each=3`) on the API, Chromium and mobile Chrome projects: 357 of 357 runs passed. The CI run above needed no retries either.

## Defects found

None open. One usability issue came up while recording the demo and was fixed: the order error message sat at the top of the checkout form, out of view for someone who had just clicked "Place order" at the bottom. It now appears right above the button.

## Known limitations

- Payments are not real. Card checks stop at format, Luhn and expiry date.
- Failures are simulated in the browser with `page.route()`, so the tests prove the frontend handles them. Server behaviour is covered separately by the API tests.
- Firefox and WebKit were run in CI only. The local machine used during development had just Chromium installed.
