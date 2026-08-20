import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Paginated list of every signed-up user, for the admin dashboard's Users tab. */
export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const limit = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get('limit') || 50)));
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') || 0));
  try {
    const sql = db();
    const rows = await sql`
      select u.id as "userId", u.email, u.display_name as "displayName",
             u.created_at as "createdAt",
             w.id as "workspaceId", w.name as "workspaceName", m.role,
             coalesce(cw.available, 0)::bigint as "creditsAvailable",
             coalesce(cw.lifetime_used, 0)::bigint as "creditsUsed"
      from users u
      left join memberships m on m.user_id = u.id
      left join workspaces w on w.id = m.workspace_id
      left join credit_wallets cw on cw.workspace_id = m.workspace_id
      order by u.created_at desc
      limit ${limit} offset ${offset}`;
    const [{ total }] = await sql`select count(*)::int as total from users`;
    return NextResponse.json(
      { users: rows, total, limit, offset },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Users query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
