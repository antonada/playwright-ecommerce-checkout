const REQUEST_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(kind, { status = null, body = null } = {}) {
    super(`API request failed: ${kind}${status ? ` (${status})` : ''}`);
    this.kind = kind; // 'http' | 'network' | 'timeout' | 'parse'
    this.status = status;
    this.body = body;
  }
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    throw new ApiError(err.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    // An HTML error page from a proxy is still an HTTP error, not a parse problem
    if (!response.ok) throw new ApiError('http', { status: response.status });
    throw new ApiError('parse', { status: response.status });
  }

  if (!response.ok) throw new ApiError('http', { status: response.status, body });
  return body;
}

export function searchProducts(query) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const qs = params.toString();
  return request(`/api/products${qs ? `?${qs}` : ''}`);
}

export function placeOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
