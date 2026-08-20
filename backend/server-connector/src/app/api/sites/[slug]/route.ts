import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Serves a published site. Deliberately public and unauthenticated — this is
 * what a visitor of the customer's website hits, so it must work with no
 * session and no cookies.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: raw } = await params;
    const slug = String(raw || '').toLowerCase().slice(0, 48);
    if (!slug) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const sql = db();
    const rows = await sql`
      select slug, project_name as "projectName", site, updated_at as "updatedAt"
      from published_sites where slug=${slug} limit 1`;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Takes a published site down. There was previously no way to do this at all
 * — deleting the local SUPERAIAGENT project only removes the client-side
 * project record; the published_sites row is a separate server-side record
 * keyed by slug and nothing ever deleted it. Same ownership check as
 * publish/route.ts (a slug belongs to whoever published it), so only the
 * workspace that owns the slug can take it down.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser(req);
    const { slug: raw } = await params;
    const slug = String(raw || '').toLowerCase().slice(0, 48);
    if (!slug) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const sql = db();
    const owner = await sql`select workspace_id from published_sites where slug=${slug}`;
    if (!owner[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (owner[0].workspace_id !== user.workspaceId) {
      return NextResponse.json({ error: 'This site belongs to a different workspace' }, { status: 403 });
    }
    await sql`delete from published_sites where slug=${slug}`;
    return NextResponse.json({ slug, deleted: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unpublish failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
