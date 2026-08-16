import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../lib/admin-auth';
import { vercelFetch, withTeam } from '../../../../../lib/vercel-api';

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const teamId = req.nextUrl.searchParams.get('teamId') || undefined;
  try {
    const data = await vercelFetch<{ projects?: Array<{ id: string; name: string; framework?: string }> }>(req, withTeam('/v9/projects', teamId));
    return NextResponse.json({ ok: true, projects: data.projects || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Project discovery failed' }, { status: 502 });
  }
}
