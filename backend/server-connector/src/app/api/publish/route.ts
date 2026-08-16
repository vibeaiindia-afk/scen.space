import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

const RESERVED = new Set([
  'api', 'agent', 'auth', 'preset', 'presets', 'admin', 'app', 'www', 'sites', 's',
  'dashboard', 'builder', 'login', 'signup', 'help', 'docs', 'pricing', 'blog',
]);

/** A slug has to survive being part of a URL, and must not shadow an app route. */
function toSlug(raw: string): string {
  const slug = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const slug = toSlug(body?.slug || body?.projectName || '');
    if (slug.length < 3) {
      return NextResponse.json({ error: 'A slug of at least 3 characters is required' }, { status: 400 });
    }
    if (RESERVED.has(slug)) {
      return NextResponse.json({ error: `"${slug}" is reserved — pick another address` }, { status: 409 });
    }
    const site = body?.site;
    if (!site || typeof site !== 'object') {
      return NextResponse.json({ error: 'A site snapshot is required' }, { status: 400 });
    }
    const projectName = String(body?.projectName || slug).slice(0, 120);
    const sql = db();
    // A slug belongs to whoever published it first; republishing keeps the URL.
    const owner = await sql`select workspace_id from published_sites where slug=${slug}`;
    if (owner[0] && owner[0].workspace_id !== user.workspaceId) {
      return NextResponse.json({ error: `"${slug}" is already taken` }, { status: 409 });
    }
    await sql`
      insert into published_sites(slug, workspace_id, project_name, site, published_by)
      values(${slug}, ${user.workspaceId}, ${projectName}, ${sql.json(site)}, ${user.sub})
      on conflict(slug) do update set
        project_name = excluded.project_name,
        site = excluded.site,
        published_by = excluded.published_by,
        updated_at = now()`;
    const base = process.env.SCEN_APP_URL || 'https://scen.space';
    return NextResponse.json(
      { slug, url: `${base.replace(/\/$/, '')}/s/${slug}`, projectName },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
