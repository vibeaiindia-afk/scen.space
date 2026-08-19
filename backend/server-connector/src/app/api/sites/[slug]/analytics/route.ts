import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Page views only — there is no per-visitor identity to count a unique visitor from. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser(req);
    const { slug: raw } = await params;
    const slug = String(raw || '').toLowerCase().slice(0, 48);
    const sql = db();
    const site = await sql`select workspace_id from published_sites where slug=${slug} limit 1`;
    if (!site[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (site[0].workspace_id !== user.workspaceId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const days = await sql`
      select day, views from site_visits
      where slug=${slug} and day >= current_date - interval '6 days'
      order by day`;
    const total = await sql`select coalesce(sum(views),0) as total from site_visits where slug=${slug}`;
    const today = days.find((d: { day: unknown }) => String(d.day).slice(0, 10) === new Date().toISOString().slice(0, 10));
    return NextResponse.json(
      {
        slug,
        pageViews: Number(total[0]?.total || 0),
        today: Number(today?.views || 0),
        last7Days: days.map((d: { day: unknown; views: unknown }) => ({
          day: String(d.day).slice(0, 10),
          views: Number(d.views || 0),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analytics lookup failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
