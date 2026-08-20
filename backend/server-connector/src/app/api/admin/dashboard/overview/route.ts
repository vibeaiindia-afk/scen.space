import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Cross-workspace business numbers for the admin dashboard's Overview tab.
 * Revenue only reflects payments captured after the billing_payments write
 * was added to handleDodoEvent() — earlier Dodo payments aren't backfilled.
 */
export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const sql = db();
    const [signups] = await sql`select count(*)::int as n from users`;
    const [active] = await sql`
      select count(distinct user_id)::int as n
      from auth_sessions
      where revoked_at is null and last_seen_at > now() - interval '30 days'`;
    const [revenue] = await sql`
      select coalesce(sum(amount_minor), 0)::bigint as minor, count(*)::int as n
      from billing_payments
      where status = 'succeeded'`;
    const [credits] = await sql`
      select coalesce(sum(units), 0)::bigint as n
      from credit_ledger
      where entry_type = 'grant'`;
    return NextResponse.json(
      {
        signups: signups.n,
        activeUsers30d: active.n,
        revenue: { minor: Number(revenue.minor), currency: 'INR', payments: revenue.n },
        creditsGranted: Number(credits.n),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Overview query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
