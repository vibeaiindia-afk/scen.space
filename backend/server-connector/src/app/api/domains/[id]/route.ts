import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

const TARGET = process.env.SCEN_DOMAIN_TARGET || 'scen.space';

/**
 * Reads DNS over HTTPS.
 *
 * The runtime has no DNS resolver, so verification asks a public resolver
 * instead of guessing. A domain is only marked live when the records the
 * customer was told to create are actually visible on the internet.
 */
async function resolve(name: string, type: 'A' | 'CNAME' | 'TXT'): Promise<string[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: 'application/dns-json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  const data = (await res.json()) as { Answer?: { type: number; data: string }[] };
  return (data.Answer || []).map((a) => String(a.data || '').replace(/^"|"$/g, '').replace(/\.$/, ''));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sql = db();
    const rows = await sql`
      select id, host, verification_token as "token" from custom_domains
      where id=${id} and workspace_id=${user.workspaceId}`;
    const domain = rows[0];
    if (!domain) return NextResponse.json({ error: 'Unknown domain' }, { status: 404 });

    const checks: { label: string; ok: boolean; found: string[] }[] = [];
    let error: string | null = null;

    try {
      const txt = await resolve(`_scen.${domain.host}`, 'TXT');
      checks.push({ label: 'Ownership (TXT)', ok: txt.includes(domain.token), found: txt });

      const apex = domain.host.split('.').length === 2;
      if (apex) {
        const a = await resolve(domain.host, 'A');
        checks.push({ label: 'Root record (A)', ok: a.includes('76.76.21.21'), found: a });
      } else {
        const cname = await resolve(domain.host, 'CNAME');
        checks.push({ label: 'Subdomain (CNAME)', ok: cname.includes(TARGET), found: cname });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'DNS lookup failed';
    }

    const ok = !error && checks.length > 0 && checks.every((c) => c.ok);
    const status = ok ? 'live' : 'pending';
    if (!error && !ok) {
      const missing = checks.filter((c) => !c.ok).map((c) => c.label);
      error = `Not visible yet: ${missing.join(', ')}. DNS can take up to an hour.`;
    }

    await sql`
      update custom_domains
      set status=${status}, last_checked_at=now(), last_error=${error}, updated_at=now()
      where id=${id}`;

    return NextResponse.json(
      { status, checks, error },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sql = db();
    const rows = await sql`
      delete from custom_domains where id=${id} and workspace_id=${user.workspaceId} returning id`;
    if (!rows[0]) return NextResponse.json({ error: 'Unknown domain' }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove that domain';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
