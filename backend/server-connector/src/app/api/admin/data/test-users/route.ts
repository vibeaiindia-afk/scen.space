import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db, dbHealth } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Removes seeded test accounts from whichever database this deployment is
 * actually using, which is the point: running the same SQL by hand went to a
 * different Neon branch and silently reported success.
 *
 * The target is hardcoded to @example.com — an IANA-reserved domain that no
 * real customer can hold — and nothing in the request can widen it.
 */
const TEST_EMAIL = '%@example.com';

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const sql = db();
    const [health, rows] = await Promise.all([
      dbHealth(),
      sql`select id, email, created_at from users where email like ${TEST_EMAIL} order by created_at`,
    ]);
    return NextResponse.json(
      { database: health, wouldDelete: rows.length, users: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const sql = db();
    const health = await dbHealth();
    const removed = await sql.begin(async (tx: any) => {
      const doomed: Array<{ id: string }> =
        await tx`select id from users where email like ${TEST_EMAIL}`;
      const ids = doomed.map((r) => r.id);
      if (!ids.length) return { users: 0 };
      // These five reference users(id) without ON DELETE CASCADE, so they have
      // to go first or the final delete raises a foreign-key violation.
      const counts: Record<string, number> = {
        review_comments: (await tx`delete from review_comments where author_id = any(${ids})`).count,
        generated_jobs: (await tx`delete from generated_jobs where user_id = any(${ids})`).count,
        assets: (await tx`delete from assets where created_by = any(${ids})`).count,
        project_versions: (await tx`delete from project_versions where created_by = any(${ids})`).count,
        projects: (await tx`delete from projects where created_by = any(${ids})`).count,
      };
      // Only workspaces whose every member is a test account. A workspace
      // shared with a real user is left alone.
      counts.workspaces = (
        await tx`delete from workspaces where id in (
          select m.workspace_id from memberships m
          join users u on u.id = m.user_id
          group by m.workspace_id
          having count(*) = count(*) filter (where u.email like ${TEST_EMAIL})
        )`
      ).count;
      counts.users = (await tx`delete from users where id = any(${ids})`).count;
      return counts;
    });
    const remaining: Array<{ n: string }> =
      await sql`select count(*)::text as n from users where email like ${TEST_EMAIL}`;
    return NextResponse.json(
      { database: health, removed, remaining: Number(remaining[0]?.n || 0) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cleanup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
