import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * Moves a published site to another workspace. Needed because published_sites
 * cascades with its workspace: deleting a seeded account would take its live
 * URL down with it, even when the site itself should be kept.
 */
export async function PATCH(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug || '').toLowerCase().trim();
    const workspaceId = String(body?.workspaceId || '').trim();
    if (!slug || !workspaceId) {
      return NextResponse.json({ error: 'slug and workspaceId are required' }, { status: 400 });
    }
    const sql = db();
    const target = await sql`select id from workspaces where id=${workspaceId}`;
    if (!target[0]) return NextResponse.json({ error: 'Unknown workspace' }, { status: 404 });
    const current = await sql`select site from published_sites where slug=${slug}`;
    if (!current[0]) return NextResponse.json({ error: 'Unknown slug' }, { status: 404 });
    const payload = typeof current[0].site === 'string' ? JSON.parse(current[0].site) : current[0].site;
    // The media has to travel with the site: assets cascade with their
    // workspace, so leaving them behind would break the live page.
    const assetIds = [payload?.heroImageAssetId, payload?.heroVideoAssetId]
      .filter(Boolean)
      .map((x: unknown) => String(x));
    let movedAssets = 0;
    if (assetIds.length) {
      const owner = await sql`
        select user_id from memberships
        where workspace_id=${workspaceId} order by role limit 1`;
      const newOwner = owner[0]?.user_id;
      if (!newOwner) {
        return NextResponse.json({ error: 'Target workspace has no members' }, { status: 409 });
      }
      const r = await sql`
        update assets set workspace_id=${workspaceId}, created_by=${newOwner}
        where id = any(${assetIds}) returning id`;
      movedAssets = r.length;
    }
    const moved = await sql`
      update published_sites
      set workspace_id=${workspaceId}, published_by=null, updated_at=now()
      where slug=${slug}
      returning slug, workspace_id as "workspaceId", project_name as "projectName"`;
    return NextResponse.json({ ...moved[0], movedAssets }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reassign failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
