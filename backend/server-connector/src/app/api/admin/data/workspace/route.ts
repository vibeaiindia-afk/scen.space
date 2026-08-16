import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Looks up which workspace an account belongs to. Granting credits needs an
 * explicit workspaceId on purpose, and without this the only way to find one
 * was to sign in as the customer.
 */
export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const email = String(req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'An email query parameter is required' }, { status: 400 });
  }
  try {
    const sql = db();
    const rows = await sql`
      select u.id as "userId", u.email, u.created_at as "createdAt",
             m.workspace_id as "workspaceId", m.role,
             w.name as "workspaceName",
             coalesce(cw.available, 0) as "creditsAvailable"
      from users u
      left join memberships m on m.user_id = u.id
      left join workspaces w on w.id = m.workspace_id
      left join credit_wallets cw on cw.workspace_id = m.workspace_id
      where lower(u.email) = ${email}
      order by m.role`;
    if (!rows.length) return NextResponse.json({ found: false, email }, { status: 404 });
    return NextResponse.json(
      { found: true, email, memberships: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
