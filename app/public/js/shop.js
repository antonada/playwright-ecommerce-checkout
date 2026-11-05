import { formatPrice, escapeHtml } from './common.js';
import { searchProducts } from './api.js';
import { addToCart } from './cart.js';

const form = document.querySelector('[data-testid="search-form"]');
const input = document.querySelector('#search-input');
const list = document.querySelector('[data-testid="product-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const summary = document.querySelector('[data-testid="results-summary"]');
const emptyState = document.querySelector('[data-testid="empty-results"]');
const errorBanner = document.querySelector('[data-testid="error-banner"]');
const toast = document.querySelector('[data-testid="toast"]');

let lastQuery = '';
let requestId = 0;
let toastTimer;

function describeError(err) {
  if (err.kind === 'timeout') return 'The store is taking too long to respond. Please try again.';
  if (err.kind === 'network') return "Can't reach the store right now. Check your connection and try again.";
  if (err.kind === 'parse') return 'The server sent an unexpected response. Please try again.';
  if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return 'Something went wrong on our side. Please try again.';
}

function renderProducts(items) {
  list.innerHTML = items
    .map(
      (p) => `
        <li class="product-card" data-testid="product-card" data-product-id="${p.id}">
          <span class="product-card__category">${escapeHtml(p.category)}</span>
          <h2 class="product-card__name">${escapeHtml(p.name)}</h2>
          <p class="product-card__price" data-testid="product-price">${formatPrice(p.price)}</p>
          <button type="button" class="button">Add to cart</button>
        </li>`,
    )
    .join('');

  list.querySelectorAll('button').forEach((button, index) => {
    button.addEventListener('click', () => {
      addToCart(items[index]);
      showToast(`${items[index].name} added to cart`);
    });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2500);
}

async function runSearch(query) {
  lastQuery = query;
  const current = ++requestId;

  errorBanner.hidden = true;
  emptyState.hidden = true;
  summary.textContent = '';
  list.innerHTML = '';
  loader.hidden = false;

  try {
    const { items } = await searchProducts(query);
    // A slower, older request must not overwrite newer results
    if (current !== requestId) return;

    renderProducts(items);
    if (items.length === 0) {
      emptyState.textContent = `No products match "${query}". Try a different search.`;
      emptyState.hidden = false;
    } else {
      summary.textContent = `${items.length} ${items.length === 1 ? 'product' : 'products'}`;
    }
  } catch (err) {
    if (current !== requestId) return;
    errorBanner.querySelector('.banner__detail').textContent = describeError(err);
    errorBanner.hidden = false;
  } finally {
    if (current === requestId) loader.hidden = true;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = input.value.trim();
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
  runSearch(query);
});

errorBanner.querySelector('[data-action="retry"]').addEventListener('click', () => runSearch(lastQuery));

const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';
input.value = initialQuery;
runSearch(initialQuery.trim());
