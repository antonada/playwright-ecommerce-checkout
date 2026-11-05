const STORAGE_KEY = 'shop.cart';

export const MAX_QTY = 10;
export const FREE_SHIPPING_FROM = 10000;
export const SHIPPING_FEE = 750;

export function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export function addToCart(product) {
  const items = getCart();
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, MAX_QTY);
  } else {
    items.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  saveCart(items);
}

export function setQuantity(id, qty) {
  const items = getCart();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(qty, MAX_QTY));
  saveCart(items);
}

export function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

export function clearCart() {
  saveCart([]);
}

export function cartCount(items = getCart()) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotals(items = getCart()) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}
