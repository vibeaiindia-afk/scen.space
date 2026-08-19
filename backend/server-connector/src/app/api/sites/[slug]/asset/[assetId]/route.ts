import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/db';
import { getObjectBody } from '@/lib/storage/s3';

export const dynamic = 'force-dynamic';

/**
 * Serves media for a published site to anonymous visitors.
 *
 * Generated assets are normally behind /api/assets/[id]/content, which requires
 * a session — fine for the studio, useless for a public website. This route is
 * public but deliberately narrow: the asset must be referenced by that site's
 * published snapshot and must belong to the workspace that published it, so
 * publishing is the only way to expose anything.
 */
/**
 * Every asset id a published snapshot legitimately points at.
 *
 * A cinematic site references a dozen more images than the hero pair — seven
 * scene layers plus a pin per sight card — and each one has to be reachable by
 * an anonymous visitor, but only through the site that published it.
 */
function referencedAssets(payload: Record<string, unknown> | null): string[] {
  const ids: unknown[] = [payload?.heroImageAssetId, payload?.heroVideoAssetId];
  const cinema = payload?.cinema as Record<string, unknown> | undefined;
  if (cinema) {
    const layers = cinema.layers as Record<string, unknown> | undefined;
    if (layers) {
      for (const layer of Object.values(layers)) {
        ids.push(typeof layer === 'string' ? layer : (layer as { assetId?: unknown })?.assetId);
      }
    }
    const cards = cinema.cards;
    if (Array.isArray(cards)) {
      for (const card of cards) {
        const pin = (card as { pin?: unknown })?.pin;
        ids.push(typeof pin === 'string' ? pin : (pin as { assetId?: unknown })?.assetId);
      }
    }
  }
  /* An agent build is pages of HTML rather than named slots, so it carries the
     ids it uses in a list beside them. Without this every photograph on a
     published agent site 404s for the visitor while working perfectly for the
     signed-in author, which is the worst shape a bug can take. */
  const listed = payload?.assetIds;
  if (Array.isArray(listed)) for (const id of listed) ids.push(id);
  return ids.filter(Boolean).map((x) => String(x));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; assetId: string }> },
) {
  try {
    const { slug: rawSlug, assetId: rawAsset } = await params;
    const slug = String(rawSlug || '').toLowerCase().slice(0, 48);
    const assetId = String(rawAsset || '').slice(0, 64);
    if (!slug || !assetId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sql = db();
    const sites = await sql`select workspace_id as "workspaceId", site from published_sites where slug=${slug} limit 1`;
    const site = sites[0];
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const payload = typeof site.site === 'string' ? JSON.parse(site.site) : site.site;
    const referenced = new Set(referencedAssets(payload));
    if (!referenced.has(assetId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const assets = await sql`
      select object_key as "objectKey", original_name as "originalName", workspace_id as "workspaceId"
      from assets where id=${assetId} and deleted_at is null limit 1`;
    const asset = assets[0];
    if (!asset || asset.workspaceId !== site.workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    /* A redirect to a presigned URL used to be returned here, but this route is
       only ever reached through the scen.space -> scen-backend cross-project
       rewrite, and that redirect-through-a-rewrite combination makes Vercel's
       own routing report INFINITE_LOOP_DETECTED (508) before this function
       runs at all — the same failure found on /api/assets/[id]/content.
       Streaming the bytes back directly avoids the redirect entirely. */
    const o = await getObjectBody(asset.objectKey);
    return new NextResponse(o.stream as any, {
      headers: {
        'Content-Type': o.contentType,
        ...(o.contentLength != null ? { 'Content-Length': String(o.contentLength) } : {}),
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Asset lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
