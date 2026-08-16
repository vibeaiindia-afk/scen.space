import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Resolve or reopen a review comment, or delete one. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const user = await requireUser(req);
    const { id, commentId } = await params;
    const body = await req.json().catch(() => ({}));
    const status = body?.status === 'open' ? 'open' : 'resolved';
    const sql = db();
    const rows = await sql`
      update review_comments
      set status=${status}, resolved_at=${status === 'resolved' ? new Date() : null}
      where id=${commentId}::uuid and project_id=${id}::uuid and workspace_id=${user.workspaceId}
      returning id, status, resolved_at as "resolvedAt"`;
    if (!rows[0]) return NextResponse.json({ error: 'Unknown comment' }, { status: 404 });
    return NextResponse.json(rows[0], { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update that comment';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const user = await requireUser(req);
    const { id, commentId } = await params;
    const sql = db();
    const rows = await sql`
      delete from review_comments
      where id=${commentId}::uuid and project_id=${id}::uuid and workspace_id=${user.workspaceId}
      returning id`;
    if (!rows[0]) return NextResponse.json({ error: 'Unknown comment' }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove that comment';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
