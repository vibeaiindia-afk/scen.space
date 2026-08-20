import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Moderation queue for the admin dashboard's Abuse Queue tab. */
export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const status = String(req.nextUrl.searchParams.get('status') || 'open');
  const limit = Math.max(1, Math.min(200, Number(req.nextUrl.searchParams.get('limit') || 100)));
  try {
    const sql = db();
    const rows =
      status === 'all'
        ? await sql`
            select id, reporter_email as "reporterEmail", target_url as "targetUrl",
                   description, status, created_at as "createdAt", resolved_at as "resolvedAt"
            from abuse_reports order by created_at desc limit ${limit}`
        : await sql`
            select id, reporter_email as "reporterEmail", target_url as "targetUrl",
                   description, status, created_at as "createdAt", resolved_at as "resolvedAt"
            from abuse_reports where status = ${status} order by created_at desc limit ${limit}`;
    return NextResponse.json(
      { reports: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Abuse report query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
