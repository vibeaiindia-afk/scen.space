import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { getAsset } from '@/lib/data/assets';
import { signGet } from '@/lib/storage/s3';
import { createVideoWithRouting } from '@/lib/video/router';
import { signVideoJob } from '@/lib/video/job-token';
import { reserveVideoCredits, commitVideoCredits, releaseVideoCredits } from '@/lib/video/credits';
import type { VideoAspectRatio, VideoResolution } from '@/lib/video/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const aspects: VideoAspectRatio[] = ['16:9', '9:16'];
const resolutions: VideoResolution[] = ['720p', '1080p', '4K'];

/**
 * Animates a stored image into a video.
 *
 * The browser cannot do this itself: asset content redirects to a signed
 * storage URL on another origin, so fetching the bytes client-side fails CORS.
 * Reading them here also keeps megabytes of base64 out of the request body.
 */
export async function POST(req: NextRequest) {
  let reservation: Awaited<ReturnType<typeof reserveVideoCredits>> | undefined;
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const assetId = String(body?.assetId || '');
    if (!assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });

    const asset = await getAsset(user, assetId);
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const signed = await signGet(asset.object_key, asset.original_name || undefined);
    const res = await fetch(signed);
    if (!res.ok) {
      return NextResponse.json({ error: `Could not read the asset (HTTP ${res.status})` }, { status: 502 });
    }
    const dataBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');

    const seconds = ([4, 8, 12].includes(Number(body?.seconds)) ? Number(body.seconds) : 4) as 4 | 8 | 12;
    const resolution: VideoResolution = resolutions.includes(body?.resolution) ? body.resolution : '720p';
    const aspectRatio: VideoAspectRatio = aspects.includes(body?.aspectRatio) ? body.aspectRatio : '16:9';

    reservation = await reserveVideoCredits({
      workspaceId: user.workspaceId,
      userId: user.sub,
      seconds,
      resolution,
      operationKey: req.headers.get('idempotency-key') || undefined,
    });
    const job = await createVideoWithRouting({
      mode: 'image',
      prompt: String(body?.prompt || ''),
      aspectRatio,
      seconds,
      resolution,
      references: [{ mimeType: asset.mime_type || 'image/png', dataBase64 }],
    });
    await commitVideoCredits(reservation, { provider: job.provider, model: job.model });
    const id = signVideoJob({
      v: 1,
      provider: job.provider,
      nativeId: job.nativeId,
      workspaceId: user.workspaceId,
      userId: user.sub,
      model: job.model,
      seconds: job.seconds || seconds,
      createdAt: Date.now(),
    });
    return NextResponse.json(
      { id, status: job.status, progress: job.progress, provider: job.provider, seconds: job.seconds || seconds },
      { status: 202, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (reservation) {
      await releaseVideoCredits(reservation, String((error as Error)?.message || error)).catch(() => {});
    }
    const message = error instanceof Error ? error.message : 'Video from asset failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
