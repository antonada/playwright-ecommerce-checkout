import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CheckoutData, CheckoutField } from '../fixtures/test-data';

const LABELS: Record<CheckoutField, string> = {
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  address: 'Street address',
  city: 'City',
  zip: 'Postal code',
  cardNumber: 'Card number',
  expiry: 'Expiry date',
  cvv: 'CVV',
};

export class CheckoutPage extends BasePage {
  readonly form: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly invalidFields: Locator;
  readonly emptyState: Locator;
  readonly confirmation: Locator;
  readonly orderNumber: Locator;
  readonly confirmationEmail: Locator;
  readonly summaryTotal: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByTestId('checkout-form');
    // The label switches to "Placing order..." mid-request, so don't tie the locator to its text
    this.submitButton = this.form.getByRole('button');
    this.formError = page.getByTestId('form-error');
    this.invalidFields = this.form.locator('[aria-invalid="true"]');
    this.emptyState = page.getByTestId('checkout-empty');
    this.confirmation = page.getByTestId('order-confirmation');
    this.orderNumber = page.getByTestId('order-number');
    this.confirmationEmail = page.getByTestId('confirmation-email');
    this.summaryTotal = page.getByTestId('summary-total');
  }

  async goto() {
    await this.page.goto('/checkout.html');
  }

  field(name: CheckoutField): Locator {
    return this.form.getByLabel(LABELS[name], { exact: true });
  }

  fieldError(name: CheckoutField): Locator {
    return this.page.getByTestId(`error-${name}`);
  }

  async fill(data: Partial<CheckoutData>) {
    for (const [name, value] of Object.entries(data) as [CheckoutField, string][]) {
      await this.field(name).fill(value);
    }
  }

  async placeOrder() {
    await this.submitButton.click();
  }
}
