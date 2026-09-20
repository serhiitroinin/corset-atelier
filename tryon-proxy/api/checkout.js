// Checkout proxy. Holds the Stripe key and the price list server-side; the static site never sees either.
// POST { items: [{ id, size, qty }], email, shipping: { firstName, lastName, line1, line2?, postal, city, country, phone?, method }, discount?, returnUrl? }
//   ->  { url, order } (Stripe Checkout Session URL) | { error }
// Client prices are never read. Totals are rebuilt here from PRICES, the discount table and the shipping rules.
// Env: STRIPE_SECRET_KEY (required), optional CHECKOUT_URL, ALLOWED_ORIGINS (comma separated).
// The ?paid=1 return only drives the thank-you page. Treat the Stripe webhook / dashboard as the record of payment.

const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://serhiitroinin.github.io').split(',').map(s => s.trim());
const CHECKOUT_URL = process.env.CHECKOUT_URL || 'https://serhiitroinin.github.io/corset-atelier/designs/maison/checkout.html';
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const PRICES = { // EUR, whole euros, VAT included
  severine: { name: 'Séverine', eur: 139 },
  aurele:   { name: 'Aurèle',   eur: 149 },
  odile:    { name: 'Odile',    eur: 99 },
  maren:    { name: 'Maren',    eur: 149 },
  colombe:  { name: 'Colombe',  eur: 169 },
  isaure:   { name: 'Isaure',   eur: 129 }
};
const CODES = { VESNA10: 10 };                       // percent off merchandise
const FREE_OVER = 12000;                             // cents, judged on the subtotal before discount
const SHIPPING = {
  standard: { cents: 695,  name: 'Standard, 2–4 days', min: 2, max: 4 },
  express:  { cents: 1495, name: 'Express, 1–2 days',  min: 1, max: 2 }
};
const COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB'];
const MAX_LINES = 20, MAX_QTY = 5;

function cors(req, res) {
  const o = req.headers.origin || '';
  const ok = ORIGINS.includes(o) || LOCAL.test(o);
  if (ok) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return ok;
}

const bad = message => Object.assign(new Error(message), { status: 400 });
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Validates the request and rebuilds the order from server-side data. Throws { status: 400 } on bad input.
export function buildOrder(body) {
  const b = body && typeof body === 'object' ? body : {};
  if (!Array.isArray(b.items) || !b.items.length) throw bad('The bag is empty.');
  if (b.items.length > MAX_LINES) throw bad('Too many lines in the bag.');

  const merged = new Map();
  for (const it of b.items) {
    const p = it && typeof it.id === 'string' && Object.hasOwn(PRICES, it.id) ? PRICES[it.id] : null;
    if (!p) throw bad('Unknown piece in the bag.');
    const size = Number(it.size), qty = Number(it.qty);
    if (!Number.isInteger(size) || size < 18 || size > 40 || size % 2) throw bad(`Unknown size for ${p.name}.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw bad(`Quantity for ${p.name} must be between 1 and ${MAX_QTY}.`);
    const key = it.id + '|' + size, prev = merged.get(key);
    if (prev) { prev.qty += qty; if (prev.qty > MAX_QTY) throw bad(`Quantity for ${p.name} must be between 1 and ${MAX_QTY}.`); }
    else merged.set(key, { id: it.id, name: p.name, size, qty, cents: p.eur * 100 });
  }
  const items = [...merged.values()];

  const email = str(b.email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad('Please enter a valid email address.');

  const s = b.shipping && typeof b.shipping === 'object' ? b.shipping : {};
  const shipping = {
    firstName: str(s.firstName, 60), lastName: str(s.lastName, 60), line1: str(s.line1, 100), line2: str(s.line2, 100),
    postal: str(s.postal, 10).toUpperCase(), city: str(s.city, 80), country: str(s.country, 2).toUpperCase(), phone: str(s.phone, 24),
    method: s.method === undefined ? 'standard' : s.method
  };
  if (!shipping.firstName || !shipping.lastName || !shipping.line1 || !shipping.city) throw bad('The delivery address is incomplete.');
  if (!/^[A-Z0-9][A-Z0-9 -]{2,9}$/.test(shipping.postal)) throw bad('The postal code does not look right.');
  if (!COUNTRIES.includes(shipping.country)) throw bad('We deliver within the EU and to the United Kingdom.');
  if (shipping.phone && !/^[0-9+() .-]{7,24}$/.test(shipping.phone)) throw bad('The phone number does not look right.');
  if (typeof shipping.method !== 'string' || !Object.hasOwn(SHIPPING, shipping.method)) throw bad('Unknown shipping method.');

  const code = str(b.discount, 24).toUpperCase();
  if (code && !Object.hasOwn(CODES, code)) throw bad('That discount code is not valid.');
  const pct = code ? CODES[code] : 0;

  const subtotal = items.reduce((n, l) => n + l.cents * l.qty, 0);
  for (const l of items) l.unit = Math.round(l.cents * (100 - pct) / 100);   // whole-euro prices: exact to the cent
  const merchandise = items.reduce((n, l) => n + l.unit * l.qty, 0);
  const rate = SHIPPING[shipping.method];
  const shippingCents = shipping.method === 'standard' && subtotal >= FREE_OVER ? 0 : rate.cents;

  return { items, email, shipping, code, pct, subtotal, discount: subtotal - merchandise, shippingCents, total: merchandise + shippingCents };
}

export function returnBase(url) {
  try {
    const u = new URL(String(url));
    if ((ORIGINS.includes(u.origin) || LOCAL.test(u.origin)) && !u.username) return u.origin + u.pathname;
  } catch {}
  return CHECKOUT_URL;
}

export function orderNumber() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(6));
  return 'VS-' + [...r].map(n => A[n % A.length]).join('');
}

// Form-encoded body for POST /v1/checkout/sessions
export function sessionParams(order, number, base) {
  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('success_url', `${base}?paid=1&order=${number}`);
  p.set('cancel_url', `${base}?cancelled=1`);
  p.set('customer_email', order.email);
  p.set('client_reference_id', number);
  p.set('locale', 'auto');
  order.items.forEach((l, i) => {
    const k = `line_items[${i}]`;
    p.set(`${k}[quantity]`, String(l.qty));
    p.set(`${k}[price_data][currency]`, 'eur');
    p.set(`${k}[price_data][unit_amount]`, String(l.unit));
    p.set(`${k}[price_data][tax_behavior]`, 'inclusive');
    p.set(`${k}[price_data][product_data][name]`, `${l.name}, size ${l.size}″`);
    if (order.pct) p.set(`${k}[price_data][product_data][description]`, `${order.code}: ${order.pct}% off €${l.cents / 100}`);
    p.set(`${k}[price_data][product_data][metadata][id]`, l.id);
    p.set(`${k}[price_data][product_data][metadata][size]`, String(l.size));
  });
  const rate = SHIPPING[order.shipping.method], so = 'shipping_options[0][shipping_rate_data]';
  p.set(`${so}[type]`, 'fixed_amount');
  p.set(`${so}[display_name]`, rate.name);
  p.set(`${so}[fixed_amount][amount]`, String(order.shippingCents));
  p.set(`${so}[fixed_amount][currency]`, 'eur');
  p.set(`${so}[tax_behavior]`, 'inclusive');
  p.set(`${so}[delivery_estimate][minimum][unit]`, 'business_day');
  p.set(`${so}[delivery_estimate][minimum][value]`, String(rate.min));
  p.set(`${so}[delivery_estimate][maximum][unit]`, 'business_day');
  p.set(`${so}[delivery_estimate][maximum][value]`, String(rate.max));
  const s = order.shipping, ship = 'payment_intent_data[shipping]';
  p.set(`${ship}[name]`, `${s.firstName} ${s.lastName}`);
  if (s.phone) p.set(`${ship}[phone]`, s.phone);
  p.set(`${ship}[address][line1]`, s.line1);
  if (s.line2) p.set(`${ship}[address][line2]`, s.line2);
  p.set(`${ship}[address][postal_code]`, s.postal);
  p.set(`${ship}[address][city]`, s.city);
  p.set(`${ship}[address][country]`, s.country);
  p.set('payment_intent_data[description]', `Vesna order ${number}`);
  for (const k of ['metadata', 'payment_intent_data[metadata]']) {
    p.set(`${k}[order]`, number);
    p.set(`${k}[items]`, order.items.map(l => `${l.id}:${l.size}x${l.qty}`).join(' ').slice(0, 480));
    p.set(`${k}[shipping_method]`, s.method);
    if (order.code) p.set(`${k}[discount]`, order.code);
  }
  return p;
}

export default async function handler(req, res) {
  const okOrigin = cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!okOrigin) return res.status(403).json({ error: 'Origin not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Checkout is not configured yet.' });

  let order;
  try { order = buildOrder(req.body); }
  catch (e) { return res.status(e.status || 400).json({ error: e.status ? e.message : 'The order could not be read.' }); }

  try {
    const number = orderNumber();
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: sessionParams(order, number, returnBase(req.body?.returnUrl)).toString()
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw Object.assign(new Error(j.error?.message || 'Stripe error'), { status: 502 });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ url: j.url, order: number });
  } catch (e) {
    console.error('checkout failed:', e.status || 500, e.message);
    return res.status(502).json({ error: 'The payment page could not be opened. Please try again.' });
  }
}
