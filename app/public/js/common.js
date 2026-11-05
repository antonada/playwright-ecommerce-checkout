import { cartCount } from './cart.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(cents) {
  return money.format(cents / 100);
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderCartBadge() {
  const badge = document.querySelector('[data-testid="cart-count"]');
  if (badge) badge.textContent = String(cartCount());
}

renderCartBadge();
window.addEventListener('cart:change', renderCartBadge);
// Keeps the badge in sync when the cart changes in another tab
window.addEventListener('storage', renderCartBadge);
