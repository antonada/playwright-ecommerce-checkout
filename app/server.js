import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateCheckout } from './public/js/validation.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(readFileSync(path.join(dirname, 'data/products.json'), 'utf8'));

const MAX_QTY = 10;
const FREE_SHIPPING_FROM = 10000;
const SHIPPING_FEE = 750;

const app = express();
app.use(express.json());
app.use(express.static(path.join(dirname, 'public')));

let nextOrderNumber = 10001;

app.get('/api/products', (req, res) => {
  const query = String(req.query.q ?? '')
    .trim()
    .toLowerCase();
  const items = query
    ? products.filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
    : products;
  res.json({ items, total: items.length });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let subtotal = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item?.id);
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item?.id}` });
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_QTY) {
      return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    }
    // Prices always come from the catalog, never from the client
    subtotal += product.price * item.qty;
  }

  const errors = validateCheckout(customer);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const orderId = `ORD-${nextOrderNumber++}`;
  res.status(201).json({ orderId, subtotal, shipping, total: subtotal + shipping });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Demo shop running at http://localhost:${port}`);
});
