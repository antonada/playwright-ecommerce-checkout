import { test, expect } from '../fixtures/test-fixtures';
import {
  expiry,
  products,
  requiredFieldMessages,
  validCustomer,
  type CheckoutField,
} from '../fixtures/test-data';

const invalidInputs: { field: CheckoutField; value: string; message: string; title?: string }[] = [
  { field: 'fullName', value: 'J', message: 'Enter your full name' },
  { field: 'email', value: 'jane@', message: 'Enter a valid email address' },
  { field: 'email', value: 'jane.cooper.example.com', message: 'Enter a valid email address' },
  { field: 'phone', value: '555-CALL-ME', message: 'Enter a valid phone number' },
  { field: 'phone', value: '12345', message: 'Enter a valid phone number' },
  { field: 'address', value: '12', message: 'Enter your street address' },
  { field: 'zip', value: '9', message: 'Enter a valid postal code' },
  { field: 'cardNumber', value: '4242', message: 'Card number should be 13 to 19 digits' },
  { field: 'cardNumber', value: '4242 4242 4242 4241', message: 'Card number is invalid' },
  { field: 'expiry', value: '13/30', message: 'Use the MM/YY format' },
  { field: 'expiry', value: '1230', message: 'Use the MM/YY format' },
  {
    field: 'expiry',
    value: expiry.lastMonth(),
    message: 'Card has expired',
    title: 'rejects a card that expired last month',
  },
  { field: 'cvv', value: '12', message: 'CVV must be 3 or 4 digits' },
  { field: 'cvv', value: 'abc', message: 'CVV must be 3 or 4 digits' },
];

test.describe('Checkout form validation', () => {
  test.beforeEach(async ({ seedCart, checkoutPage }) => {
    await seedCart([{ ...products.backpack, qty: 1 }]);
    await checkoutPage.goto();
  });

  test(
    'flags every required field when the form is submitted empty',
    { tag: '@smoke' },
    async ({ checkoutPage, page }) => {
      let orderRequests = 0;
      page.on('request', (req) => {
        if (req.url().endsWith('/api/orders')) orderRequests++;
      });

      await checkoutPage.placeOrder();

      for (const [field, message] of Object.entries(requiredFieldMessages)) {
        await expect(checkoutPage.fieldError(field as CheckoutField)).toHaveText(message);
        await expect(checkoutPage.field(field as CheckoutField)).toHaveAttribute('aria-invalid', 'true');
      }
      await expect(checkoutPage.field('fullName')).toBeFocused();
      expect(orderRequests).toBe(0);
    },
  );

  for (const { field, value, message, title } of invalidInputs) {
    test(title ?? `rejects ${field} "${value}"`, async ({ checkoutPage }) => {
      await checkoutPage.fill({ ...validCustomer, [field]: value });
      await checkoutPage.placeOrder();

      await expect(checkoutPage.fieldError(field)).toHaveText(message);
      // Only the broken field should be marked, the rest of the form is fine
      await expect(checkoutPage.invalidFields).toHaveCount(1);
      await expect(checkoutPage.confirmation).toBeHidden();
    });
  }

  test('moves focus to the first invalid field', async ({ checkoutPage }) => {
    await checkoutPage.fill({ ...validCustomer, zip: '', cvv: '1' });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.field('zip')).toBeFocused();
    await expect(checkoutPage.invalidFields).toHaveCount(2);
  });

  test('shows an error as soon as the user leaves an invalid field', async ({ checkoutPage }) => {
    await checkoutPage.field('email').fill('not-an-email');
    await checkoutPage.field('email').blur();

    await expect(checkoutPage.fieldError('email')).toHaveText('Enter a valid email address');
  });

  test('clears the error once the value is fixed', async ({ checkoutPage }) => {
    await checkoutPage.fill({ ...validCustomer, email: 'jane@' });
    await checkoutPage.placeOrder();
    await expect(checkoutPage.fieldError('email')).toHaveText('Enter a valid email address');

    await checkoutPage.field('email').fill(validCustomer.email);

    await expect(checkoutPage.fieldError('email')).toBeEmpty();
    await expect(checkoutPage.field('email')).not.toHaveAttribute('aria-invalid');
  });

  test('accepts a card that expires this month', async ({ checkoutPage }) => {
    await checkoutPage.fill({ ...validCustomer, expiry: expiry.thisMonth() });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.confirmation).toBeVisible();
  });

  test('accepts card numbers typed with dashes', async ({ checkoutPage }) => {
    await checkoutPage.fill({ ...validCustomer, cardNumber: '5555-5555-5555-4444' });
    await checkoutPage.placeOrder();

    await expect(checkoutPage.confirmation).toBeVisible();
  });
});
