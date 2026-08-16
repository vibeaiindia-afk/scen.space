import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { ADMIN_COOKIE, createAdminSessionCookie, requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const TTL_SECONDS = 12 * 60 * 60;

function equals(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Status probe. Always 200 so the browser can ask "am I staff?" without an
// error in the console; the answer itself carries no privileged data.
export async function GET(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    return NextResponse.json(
      { admin: true, role: session.role, exp: session.exp },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ admin: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

// Sign in as staff. requireAdmin verifies a signed cookie but nothing issued
// one, so every /api/admin route was unreachable for everybody until now.
export async function POST(req: NextRequest) {
  // Pasting a generated key into a dashboard field very often carries a
  // trailing newline or space; neither side should fail over invisible padding.
  const expected = (process.env.SCEN_ADMIN_KEY || '').trim();
  // Distinguish the two failure modes so a misconfigured deployment can be
  // diagnosed without ever reporting the value itself.
  if (!expected) {
    return NextResponse.json(
      { error: 'SCEN_ADMIN_KEY is not set on this deployment' },
      { status: 503 },
    );
  }
  if (expected.length < 24) {
    return NextResponse.json(
      { error: 'SCEN_ADMIN_KEY is set but shorter than 24 characters' },
      { status: 503 },
    );
  }
  let supplied = '';
  try {
    supplied = String(((await req.json()) as { key?: unknown })?.key || '').trim();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }
  // Compare in constant time, and only after both sides are non-empty so a
  // blank body cannot short-circuit into a match.
  if (!supplied || !equals(supplied, expected)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
  }
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const value = createAdminSessionCookie({ sub: 'staff', role: 'owner', exp });
  const res = NextResponse.json({ admin: true, role: 'owner', exp });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ admin: false });
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
