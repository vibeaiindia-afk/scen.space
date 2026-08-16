import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../../lib/admin-auth';
import { vercelFetch, withTeam } from '../../../../../../lib/vercel-api';

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const projectId = req.nextUrl.searchParams.get('projectId');
  const teamId = req.nextUrl.searchParams.get('teamId') || undefined;
  if (!projectId || !id) return NextResponse.json({ error: 'projectId and env id are required' }, { status: 400 });
  try {
    await vercelFetch(req, withTeam(`/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(id)}`, teamId), { method: 'DELETE' });
    return NextResponse.json({ ok: true, deleted: id, deploymentTriggered: false });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Environment delete failed' }, { status: 502 });
  }
}
