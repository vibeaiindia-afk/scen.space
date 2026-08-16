import { NextRequest, NextResponse } from 'next/server';
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
