import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/**
 * One row per site per day, incremented atomically. A visitor of the
 * customer's published site hits this with no session and no cookies, same
 * as GET /api/sites/[slug] — so it stays a plain counter, not a fingerprint:
 * no IP, no user agent, no per-visitor identity stored.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: raw } = await params;
    const slug = String(raw || '').toLowerCase().slice(0, 48);
    if (!slug) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const sql = db();
    const owner = await sql`select 1 from published_sites where slug=${slug} limit 1`;
    if (!owner[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await sql`
      insert into site_visits(slug, day, views) values(${slug}, current_date, 1)
      on conflict(slug, day) do update set views = site_visits.views + 1`;
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tracking failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
