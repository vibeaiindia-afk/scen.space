import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Cross-workspace payments list for the admin dashboard's Payments tab.
 * Reads billing_payments, which only Dodo top-ups/subscriptions write to
 * today (see handleDodoEvent in src/lib/billing/events.ts) — Stripe/Razorpay
 * revenue isn't in this table yet.
 */
export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const limit = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get('limit') || 50)));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') || 0));
  try {
    const sql = db();
    const rows = await sql`
      select p.id, p.provider, p.provider_payment_id as "providerPaymentId",
             p.kind, p.amount_minor as "amountMinor", p.currency, p.status,
             p.created_at as "createdAt",
             w.id as "workspaceId", w.name as "workspaceName"
      from billing_payments p
      left join workspaces w on w.id = p.workspace_id
      order by p.created_at desc
      limit ${limit} offset ${offset}`;
    const [{ total }] = await sql`select count(*)::int as total from billing_payments`;
    return NextResponse.json(
      { payments: rows, total, limit, offset },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payments query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
