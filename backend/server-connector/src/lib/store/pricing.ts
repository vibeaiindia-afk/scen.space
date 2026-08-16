import crypto from 'node:crypto';
import { db } from '../data/db';

export type CartLine = { productId: string; qty: number };
export type PricedLine = { productId: string; name: string; unitPriceMinor: number; qty: number; lineTotalMinor: number };
export type PricedCart = {
  currency: string;
  lines: PricedLine[];
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  totalMinor: number;
};

const MAX_QTY = 99;
const MAX_LINES = 50;

export type StoreSettings = { currency: string; taxRateBp: number; shippingMinor: number; freeShippingAtMinor: number };

export async function storeSettings(workspaceId: string): Promise<StoreSettings> {
  const sql = db();
  const r = await sql`select currency,tax_rate_bp,shipping_minor,free_shipping_at_minor from store_settings where workspace_id=${workspaceId}`;
  const s = r[0];
  return {
    currency: s?.currency || 'INR',
    taxRateBp: Number(s?.tax_rate_bp ?? 1800),
    shippingMinor: Number(s?.shipping_minor ?? 9900),
    freeShippingAtMinor: Number(s?.free_shipping_at_minor ?? 250000),
  };
}

/**
 * Prices a cart entirely from database rows. The client sends product ids and
 * quantities only — never an amount — so a tampered browser payload cannot
 * change what is charged.
 */
export async function priceCart(workspaceId: string, cart: CartLine[]): Promise<PricedCart> {
  if (!Array.isArray(cart) || !cart.length) throw Object.assign(new Error('Cart is empty'), { status: 400, code: 'empty_cart' });
  if (cart.length > MAX_LINES) throw Object.assign(new Error('Too many cart lines'), { status: 413, code: 'cart_too_large' });

  // Collapse duplicate lines so the same product cannot be double-counted.
  const wanted = new Map<string, number>();
  for (const line of cart) {
    const id = String(line?.productId || '').trim();
    const qty = Math.floor(Number(line?.qty || 0));
    if (!id) throw Object.assign(new Error('Cart line is missing a product'), { status: 400, code: 'invalid_line' });
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) throw Object.assign(new Error('Invalid quantity'), { status: 400, code: 'invalid_qty' });
    wanted.set(id, Math.min(MAX_QTY, (wanted.get(id) || 0) + qty));
  }

  const sql = db();
  const ids = [...wanted.keys()];
  const rows = await sql`select id,name,price_minor,currency,stock,status from store_products
                         where workspace_id=${workspaceId} and id = any(${ids})`;

  const settings = await storeSettings(workspaceId);
  const lines: PricedLine[] = [];
  for (const id of ids) {
    const p = rows.find((r: any) => r.id === id);
    if (!p) throw Object.assign(new Error('Product is no longer available'), { status: 404, code: 'product_missing' });
    if (p.status !== 'active') throw Object.assign(new Error(`${p.name} is not available`), { status: 409, code: 'product_inactive' });
    const qty = wanted.get(id)!;
    if (Number(p.stock) < qty) throw Object.assign(new Error(`Only ${p.stock} left of ${p.name}`), { status: 409, code: 'insufficient_stock' });
    const unit = Number(p.price_minor);
    lines.push({ productId: id, name: p.name, unitPriceMinor: unit, qty, lineTotalMinor: unit * qty });
  }

  const subtotalMinor = lines.reduce((n, l) => n + l.lineTotalMinor, 0);
  const taxMinor = Math.round((subtotalMinor * settings.taxRateBp) / 10000);
  const shippingMinor = subtotalMinor >= settings.freeShippingAtMinor ? 0 : settings.shippingMinor;
  return { currency: settings.currency, lines, subtotalMinor, taxMinor, shippingMinor, totalMinor: subtotalMinor + taxMinor + shippingMinor };
}

export function orderNumber() {
  return '#' + crypto.randomInt(100000, 999999);
}
