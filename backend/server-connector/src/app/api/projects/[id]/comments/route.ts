import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Review comments on a project.
 *
 * The table has existed since the first migration but nothing ever read or
 * wrote it, so the review panel showed a fixed "0 open comments" and an
 * approval count that came from nowhere. These are the real rows.
 */

async function assertProject(workspaceId: string, projectId: string) {
  const sql = db();
  const rows = await sql`
    select id from projects where id=${projectId}::uuid and workspace_id=${workspaceId} and deleted_at is null`;
  return !!rows[0];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    if (!(await assertProject(user.workspaceId, id))) {
      return NextResponse.json({ error: 'Unknown project' }, { status: 404 });
    }
    const sql = db();
    const rows = await sql`
      select c.id, c.body, c.status, c.object_ref as "objectRef",
             c.created_at as "createdAt", c.resolved_at as "resolvedAt",
             u.email as "authorEmail"
      from review_comments c
      left join users u on u.id = c.author_id
      where c.workspace_id=${user.workspaceId} and c.project_id=${id}::uuid
      order by c.created_at desc`;
    const open = rows.filter((r: { status: string }) => r.status === 'open').length;
    return NextResponse.json(
      { comments: rows, open, resolved: rows.length - open },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load comments';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const text = String(body?.body || '').trim().slice(0, 2000);
    const objectRef = body?.objectRef ? String(body.objectRef).slice(0, 120) : null;
    if (!text) return NextResponse.json({ error: 'Write a comment first' }, { status: 400 });
    if (!(await assertProject(user.workspaceId, id))) {
      return NextResponse.json({ error: 'Unknown project' }, { status: 404 });
    }
    const sql = db();
    const rows = await sql`
      insert into review_comments(id, workspace_id, project_id, object_ref, author_id, body)
      values(${randomUUID()}::uuid, ${user.workspaceId}, ${id}::uuid, ${objectRef}, ${user.sub}, ${text})
      returning id, body, status, object_ref as "objectRef", created_at as "createdAt"`;
    return NextResponse.json(
      { comment: { ...rows[0], authorEmail: user.email || null } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save that comment';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
