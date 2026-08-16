import crypto from 'node:crypto';
import { db } from '../data/db';
import { priceCart, orderNumber, type CartLine } from './pricing';

export type Customer = { name?: string; email?: string; phone?: string; address?: string; city?: string; postalCode?: string; note?: string };

/**
 * Creates a pending order from server-priced lines. Nothing is marked paid here —
 * only a verified provider webhook may do that.
 */
export async function createPendingOrder(workspaceId: string, cart: CartLine[], customer: Customer) {
  const priced = await priceCart(workspaceId, cart);
  const sql = db();
  const id = 'ord_' + crypto.randomUUID();
  const number = orderNumber();

  await sql.begin(async (tx: any) => {
    await tx`insert into store_orders(id,workspace_id,order_number,customer_name,customer_email,customer_phone,address_line,city,postal_code,note,
             subtotal_minor,tax_minor,shipping_minor,total_minor,currency,status)
             values(${id},${workspaceId},${number},${customer.name || null},${customer.email || null},${customer.phone || null},
             ${customer.address || null},${customer.city || null},${customer.postalCode || null},${customer.note || null},
             ${priced.subtotalMinor},${priced.taxMinor},${priced.shippingMinor},${priced.totalMinor},${priced.currency},'pending')`;
    for (const l of priced.lines) {
      await tx`insert into store_order_items(id,order_id,product_id,name_snapshot,unit_price_minor,qty,line_total_minor)
               values(${'oit_' + crypto.randomUUID()},${id},${l.productId},${l.name},${l.unitPriceMinor},${l.qty},${l.lineTotalMinor})`;
    }
  });

  return { orderId: id, orderNumber: number, ...priced };
}

export async function attachProviderReference(orderId: string, provider: string, reference: string) {
  const sql = db();
  await sql`update store_orders set payment_provider=${provider},provider_reference=${reference},updated_at=now() where id=${orderId}`;
}

/**
 * Marks an order paid and decrements stock, once. Re-delivery of the same webhook
 * is a no-op because only a row still in 'pending' is updated.
 */
export async function markOrderPaid(orderId: string, paymentId: string) {
  const sql = db();
  return await sql.begin(async (tx: any) => {
    const claimed = await tx`update store_orders set status='paid',provider_payment_id=${paymentId},updated_at=now()
                             where id=${orderId} and status='pending' returning id,workspace_id,total_minor`;
    if (!claimed[0]) return { updated: false };
    const items = await tx`select product_id,qty from store_order_items where order_id=${orderId}`;
    for (const it of items) {
      if (!it.product_id) continue;
      await tx`update store_products set stock=greatest(0,stock-${Number(it.qty)}),updated_at=now() where id=${it.product_id}`;
    }
    return { updated: true, workspaceId: claimed[0].workspace_id, totalMinor: Number(claimed[0].total_minor) };
  });
}

export async function markOrderFailed(orderId: string, reason: string) {
  const sql = db();
  await sql`update store_orders set status='failed',note=coalesce(note,'')||${' | ' + reason},updated_at=now()
            where id=${orderId} and status='pending'`;
}

export async function getOrderPublic(workspaceId: string, orderId: string) {
  const sql = db();
  const r = await sql`select id,order_number,status,total_minor,currency,fulfillment,created_at
                      from store_orders where id=${orderId} and workspace_id=${workspaceId}`;
  return r[0] || null;
}
