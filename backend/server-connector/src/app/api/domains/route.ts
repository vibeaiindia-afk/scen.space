import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';
import { randomUUID, randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/** The address a customer points their domain at. */
const TARGET = process.env.SCEN_DOMAIN_TARGET || 'scen.space';

/**
 * Domains a workspace has claimed.
 *
 * Until now the Domains page kept its rows in the browser only, so the same
 * host could be added twice and nothing survived a reload. These live in the
 * database, one row per host across the whole product, which is what makes a
 * host claimable at all.
 */

const HOST = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

function normalise(raw: unknown): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
}

/** What the customer has to create at their registrar. */
function records(host: string, token: string) {
  const apex = host.split('.').length === 2;
  return [
    apex
      ? { type: 'A', name: '@', value: '76.76.21.21', note: 'Points the root domain at Scen' }
      : { type: 'CNAME', name: host.split('.')[0], value: TARGET, note: 'Points the subdomain at Scen' },
    { type: 'TXT', name: `_scen.${host}`, value: token, note: 'Proves you own this domain' },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const sql = db();
    const rows = await sql`
      select id, host, slug, status, verification_token as "token",
             last_checked_at as "lastCheckedAt", last_error as "lastError", created_at as "createdAt"
      from custom_domains where workspace_id=${user.workspaceId} order by created_at desc`;
    return NextResponse.json(
      {
        domains: rows.map((d: { host: string; token: string }) => ({
          ...d,
          records: records(d.host, d.token),
        })),
        target: TARGET,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load domains';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const host = normalise(body?.host);
    const slug = body?.slug ? String(body.slug).toLowerCase().slice(0, 48) : null;

    if (!HOST.test(host)) {
      return NextResponse.json(
        { error: 'Enter a domain like example.com or shop.example.com' },
        { status: 400 },
      );
    }
    if (host.endsWith('scen.space')) {
      return NextResponse.json({ error: 'That domain already belongs to Scen' }, { status: 400 });
    }

    const sql = db();
    const existing = await sql`select workspace_id as "ws" from custom_domains where lower(host)=${host}`;
    if (existing[0]) {
      return NextResponse.json(
        {
          error:
            existing[0].ws === user.workspaceId
              ? 'You have already added that domain'
              : 'That domain is claimed by another workspace',
        },
        { status: 409 },
      );
    }

    const id = randomUUID();
    const token = `scen-verify-${randomBytes(16).toString('hex')}`;
    const rows = await sql`
      insert into custom_domains(id, workspace_id, host, slug, verification_token, created_by)
      values(${id}, ${user.workspaceId}, ${host}, ${slug}, ${token}, ${user.sub})
      returning id, host, slug, status, verification_token as "token", created_at as "createdAt"`;
    return NextResponse.json(
      { domain: { ...rows[0], records: records(host, token) }, target: TARGET },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not add that domain';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
