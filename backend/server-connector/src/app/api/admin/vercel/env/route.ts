import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../lib/admin-auth';
import { vercelFetch, withTeam } from '../../../../../lib/vercel-api';

const TARGETS = new Set(['development', 'preview', 'production']);

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const projectId = req.nextUrl.searchParams.get('projectId');
  const teamId = req.nextUrl.searchParams.get('teamId') || undefined;
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  try {
    const data = await vercelFetch<{ envs?: Array<{ id: string; key: string; target?: string[]; type?: string }> }>(
      req,
      withTeam(`/v10/projects/${encodeURIComponent(projectId)}/env`, teamId),
    );
    return NextResponse.json({ ok: true, envs: (data.envs || []).map(x => ({ id: x.id, key: x.key, target: x.target, type: x.type })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Environment list failed' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const body = await req.json() as {
    projectIdOrName?: string;
    teamId?: string;
    key?: string;
    value?: string;
    target?: 'development' | 'preview' | 'production';
    comment?: string;
  };
  const { projectIdOrName, teamId, key, value, target = 'preview' } = body;
  if (!projectIdOrName || !key || !value || !TARGETS.has(target)) {
    return NextResponse.json({ error: 'projectIdOrName, key, value and a valid target are required' }, { status: 400 });
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
    return NextResponse.json({ error: 'Invalid environment-variable key' }, { status: 400 });
  }
  const params = new URLSearchParams({ upsert: 'true' });
  if (teamId) params.set('teamId', teamId);
  const type = target === 'development' ? 'encrypted' : 'sensitive';
  try {
    const result = await vercelFetch<{ created?: { id?: string; key?: string; type?: string }; failed?: unknown[] }>(
      req,
      `/v10/projects/${encodeURIComponent(projectIdOrName)}/env?${params.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify([{
          key,
          value,
          type,
          target: [target],
          comment: body.comment || 'Managed by Scen Admin',
        }]),
      },
    );
    return NextResponse.json({
      ok: true,
      created: result.created ? { id: result.created.id, key: result.created.key, type: result.created.type } : null,
      failed: result.failed || [],
      target,
      deploymentTriggered: false,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Environment sync failed' }, { status: 502 });
  }
}
