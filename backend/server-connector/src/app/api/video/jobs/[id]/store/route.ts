import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { verifyVideoJob } from '@/lib/video/job-token';
import { downloadVideo, getVideoStatus } from '@/lib/video/router';
import { persistGeneratedVideo } from '@/lib/video/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

/**
 * Stores a finished render and returns its asset id as JSON.
 *
 * The sibling /content route redirects to a signed storage URL, which the
 * browser cannot follow with fetch (cross-origin), so there was no way to learn
 * the asset id client-side — and the id is what a published site needs.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const claims = verifyVideoJob(id, { workspaceId: user.workspaceId, userId: user.sub });
    const status = await getVideoStatus(claims.provider, claims.nativeId, claims.model);
    if (status.status !== 'completed') {
      return NextResponse.json(
        { error: 'Video is not completed yet', status: status.status, progress: status.progress },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const download = await downloadVideo(claims.provider, claims.nativeId);
    const saved = await persistGeneratedVideo(download, {
      workspaceId: user.workspaceId,
      userId: user.sub,
      provider: claims.provider,
      model: claims.model,
      jobId: id,
    });
    if (!saved?.assetId) {
      return NextResponse.json({ error: 'Video could not be stored' }, { status: 502 });
    }
    return NextResponse.json(
      { assetId: saved.assetId, url: saved.url },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Store failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
