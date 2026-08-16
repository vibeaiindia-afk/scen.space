import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../lib/admin-auth';
import { vercelFetch } from '../../../../../lib/vercel-api';

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const [user, teams] = await Promise.all([
      vercelFetch<{ id?: string; user?: { id?: string; username?: string; email?: string } }>(req, '/v2/user'),
      vercelFetch<{ teams?: Array<{ id: string; slug: string; name: string }> }>(req, '/v2/teams?limit=100'),
    ]);
    return NextResponse.json({ ok: true, user: user.user || user, teams: teams.teams || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Vercel status failed' }, { status: 502 });
  }
}
