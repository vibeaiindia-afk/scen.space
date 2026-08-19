import { NextRequest, NextResponse } from 'next/server';
import { createPendingOrder, attachProviderReference } from '@/lib/store/orders';
import { dodoStoreCheckout } from '@/lib/billing/providers/dodo';

export const dynamic = 'force-dynamic';

/**
 * Public storefront checkout — the buyer is a visitor, not a Scen user.
 *
 * The request carries product ids and quantities only. Every price, tax and
 * shipping figure is read from the database for the owning workspace, so a
 * tampered client cannot influence the amount charged.
 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const workspaceId = String(b?.workspaceId || '').trim();
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });

    const items = Array.isArray(b?.items) ? b.items : [];
    const c = b?.customer || {};
    const customer = {
      name: String(c.name || '').trim().slice(0, 120),
      email: String(c.email || '').trim().slice(0, 200),
      phone: String(c.phone || '').trim().slice(0, 20),
      address: String(c.address || '').trim().slice(0, 300),
      city: String(c.city || '').trim().slice(0, 120),
      postalCode: String(c.postalCode || '').trim().slice(0, 20),
      note: String(c.note || '').trim().slice(0, 500),
    };
    if (!customer.phone) return NextResponse.json({ error: 'A contact phone number is required' }, { status: 400 });

    const order = await createPendingOrder(workspaceId, items, customer);

    const method = b?.method === 'cod' ? 'cod' : 'online';
    if (method === 'cod') {
      return NextResponse.json(
        { orderId: order.orderId, orderNumber: order.orderNumber, totalMinor: order.totalMinor, currency: order.currency, method: 'cod', status: 'pending' },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const pay = await dodoStoreCheckout({
      workspaceId,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      amountMinor: order.totalMinor,
      email: customer.email || undefined,
      phone: customer.phone,
      name: customer.name || undefined,
      returnUrl: typeof b?.returnUrl === 'string' ? b.returnUrl : undefined,
    });
    await attachProviderReference(order.orderId, 'dodo', pay.id);

    return NextResponse.json(
      {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        totalMinor: order.totalMinor,
        currency: order.currency,
        method: 'online',
        provider: 'dodo',
        paymentUrl: pay.url,
        status: 'pending',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Checkout failed', code: e?.code || 'store_checkout_error' },
      { status: e?.status || 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
