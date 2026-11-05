import { formatPrice, escapeHtml } from './common.js';
import { getCart, setQuantity, removeFromCart, cartTotals, MAX_QTY } from './cart.js';

const list = document.querySelector('[data-testid="cart-items"]');
const content = document.querySelector('[data-testid="cart-content"]');
const emptyState = document.querySelector('[data-testid="empty-cart"]');

function render() {
  const items = getCart();
  emptyState.hidden = items.length > 0;
  content.hidden = items.length === 0;
  if (items.length === 0) return;

  list.innerHTML = items
    .map(
      (item) => `
        <li class="cart-item" data-testid="cart-item" data-product-id="${item.id}">
          <div class="cart-item__info">
            <h2 class="cart-item__name">${escapeHtml(item.name)}</h2>
            <span class="cart-item__unit">${formatPrice(item.price)} each</span>
          </div>
          <div class="qty" role="group" aria-label="Quantity">
            <button type="button" data-action="decrease" aria-label="Decrease quantity" ${item.qty <= 1 ? 'disabled' : ''}>-</button>
            <span data-testid="item-qty">${item.qty}</span>
            <button type="button" data-action="increase" aria-label="Increase quantity" ${item.qty >= MAX_QTY ? 'disabled' : ''}>+</button>
          </div>
          <span class="cart-item__total" data-testid="item-total">${formatPrice(item.price * item.qty)}</span>
          <button type="button" class="link-button" data-action="remove">Remove</button>
        </li>`,
    )
    .join('');

  const totals = cartTotals(items);
  document.querySelector('[data-testid="cart-subtotal"]').textContent = formatPrice(totals.subtotal);
  document.querySelector('[data-testid="cart-shipping"]').textContent =
    totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping);
  document.querySelector('[data-testid="cart-total"]').textContent = formatPrice(totals.total);
}

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('[data-product-id]');
  const id = row.dataset.productId;
  const item = getCart().find((i) => i.id === id);
  if (!item) return;

  if (button.dataset.action === 'increase') setQuantity(id, item.qty + 1);
  if (button.dataset.action === 'decrease') setQuantity(id, item.qty - 1);
  if (button.dataset.action === 'remove') removeFromCart(id);
});

window.addEventListener('cart:change', render);
window.addEventListener('storage', render);
render();
