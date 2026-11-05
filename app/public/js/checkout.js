import { formatPrice, escapeHtml } from './common.js';
import { getCart, cartTotals, clearCart } from './cart.js';
import { placeOrder } from './api.js';
import { CHECKOUT_FIELDS, validateField, validateCheckout } from './validation.js';

const content = document.querySelector('[data-testid="checkout-content"]');
const emptyState = document.querySelector('[data-testid="checkout-empty"]');
const confirmation = document.querySelector('[data-testid="order-confirmation"]');
const form = document.querySelector('[data-testid="checkout-form"]');
const formError = document.querySelector('[data-testid="form-error"]');
const submitButton = form.querySelector('button[type="submit"]');

let submitting = false;

function renderSummary() {
  const items = getCart();
  document.querySelector('[data-testid="summary-items"]').innerHTML = items
    .map(
      (item) =>
        `<li><span>${escapeHtml(item.name)} &times; ${item.qty}</span><span>${formatPrice(item.price * item.qty)}</span></li>`,
    )
    .join('');

  const totals = cartTotals(items);
  document.querySelector('[data-testid="summary-subtotal"]').textContent = formatPrice(totals.subtotal);
  document.querySelector('[data-testid="summary-shipping"]').textContent =
    totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping);
  document.querySelector('[data-testid="summary-total"]').textContent = formatPrice(totals.total);
}

function setFieldError(name, message) {
  const input = form.elements[name];
  const error = document.getElementById(`error-${name}`);
  error.textContent = message ?? '';
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function showErrors(errors) {
  for (const name of CHECKOUT_FIELDS) setFieldError(name, errors[name]);
  const firstInvalid = CHECKOUT_FIELDS.find((name) => errors[name]);
  if (firstInvalid) form.elements[firstInvalid].focus();
}

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

function readForm() {
  const data = {};
  for (const name of CHECKOUT_FIELDS) data[name] = form.elements[name].value.trim();
  return data;
}

function describeOrderError(err) {
  if (err.kind === 'timeout') return 'The server took too long to respond. Please try again.';
  if (err.kind === 'network') return "Can't reach the server. Check your connection and try again.";
  if (err.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (err.status === 400 && err.body?.error) return err.body.error;
  return 'Something went wrong on our side. Please try again in a moment.';
}

function setSubmitting(value) {
  submitting = value;
  submitButton.disabled = value;
  submitButton.textContent = value ? 'Placing order...' : 'Place order';
}

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;

  showFormError('');
  const customer = readForm();
  const errors = validateCheckout(customer);
  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }

  setSubmitting(true);
  try {
    const items = getCart().map(({ id, qty }) => ({ id, qty }));
    const order = await placeOrder({ customer, items });

    clearCart();
    content.hidden = true;
    confirmation.hidden = false;
    confirmation.querySelector('[data-testid="order-number"]').textContent = order.orderId;
    confirmation.querySelector('[data-testid="confirmation-email"]').textContent = customer.email;
  } catch (err) {
    const serverErrors = err.status === 400 ? err.body?.errors : null;
    if (serverErrors) {
      showErrors(serverErrors);
      showFormError("We couldn't place your order. Please fix the highlighted fields.");
    } else {
      showFormError(`We couldn't place your order. ${describeOrderError(err)}`);
    }
  } finally {
    setSubmitting(false);
  }
}

form.addEventListener('submit', handleSubmit);

for (const name of CHECKOUT_FIELDS) {
  const input = form.elements[name];
  // Re-check while typing only once a field is already marked invalid, so we don't nag on the first keystroke
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') setFieldError(name, validateField(name, input.value));
  });
  input.addEventListener('blur', () => {
    if (input.value.trim()) setFieldError(name, validateField(name, input.value));
  });
}

if (getCart().length === 0) {
  emptyState.hidden = false;
} else {
  content.hidden = false;
  renderSummary();
}
