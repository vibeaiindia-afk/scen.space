import { VideoProviderError, type NativeVideoJob, type VideoCreateInput, type VideoDownload, type VideoProviderAdapter, type VideoStatus } from '../types';

// xAI Imagine video. Async: create returns a request_id, then poll until the
// status is terminal and a video URL is present.
// Base URL and model are env-configurable so an API revision needs no code change.
const BASE = () => process.env.SCEN_GROK_VIDEO_BASE_URL || process.env.SCEN_GROK_BASE_URL || 'https://api.x.ai/v1';
const MODEL = () => process.env.SCEN_GROK_VIDEO_MODEL || 'grok-imagine-video-1.5';

function key() {
  const k = process.env.XAI_API_KEY;
  if (!k) throw new VideoProviderError('grok', 'XAI_API_KEY is not configured', 503, false, 'missing_key');
  return k;
}
function parse(raw: string) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }

async function call(path: string, init: RequestInit, signal: AbortSignal) {
  const r = await fetch(BASE() + path, { ...init, signal, headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const raw = await r.text();
  const b = parse(raw);
  if (!r.ok) {
    const msg = b?.error?.message || b?.error || b?.message || `xAI video request failed (${r.status})`;
    throw new VideoProviderError('grok', String(msg), r.status, r.status === 429 || r.status >= 500, b?.error?.code || 'video_provider_error');
  }
  return b;
}

// xAI reports done/failed/expired; anything else is still running.
function mapStatus(s: string): VideoStatus {
  const v = String(s || '').toLowerCase();
  if (v === 'done' || v === 'completed' || v === 'succeeded') return 'completed';
  if (v === 'failed' || v === 'error') return 'failed';
  if (v === 'expired' || v === 'canceled' || v === 'cancelled') return 'canceled';
  if (v === 'queued' || v === 'pending') return 'queued';
  return 'in_progress';
}
function videoUrl(b: any): string { return String(b?.video?.url || b?.url || b?.output?.url || ''); }

export const grokVideoAdapter: VideoProviderAdapter = {
  id: 'grok',
  envKey: 'XAI_API_KEY',
  defaultModel: MODEL(),
  isConfigured: () => Boolean(process.env.XAI_API_KEY),

  async test(modelOverride?: string) {
    key();
    return { ok: true as const, model: modelOverride || MODEL(), detail: 'Credentials present; no paid generation was started.' };
  },

  supports(input: VideoCreateInput) {
    if (input.mode === 'frames') return { ok: false, reason: 'xAI video does not accept first+last frame pairs' };
    if (input.mode === 'image' && !input.references[0]) return { ok: false, reason: 'Image-to-video needs a reference image' };
    return { ok: true };
  },

  async create(input, signal, modelOverride) {
    const model = modelOverride || MODEL();
    const body: any = { model, prompt: input.prompt, duration: input.seconds };
    if (input.aspectRatio) body.aspect_ratio = input.aspectRatio;
    if (input.resolution) body.resolution = input.resolution;
    const ref = input.references[0];
    if (input.mode === 'image' && ref) body.image = { url: `data:${ref.mimeType};base64,${ref.dataBase64}` };

    const b = await call('/videos/generations', { method: 'POST', body: JSON.stringify(body) }, signal);
    const id = String(b?.request_id || b?.id || '');
    if (!id) throw new VideoProviderError('grok', 'xAI did not return a request id', 502, true, 'missing_job_id');
    return { nativeId: id, provider: 'grok', model, status: mapStatus(b?.status || 'queued'), progress: 0, seconds: input.seconds, providerRequestId: id };
  },

  async status(nativeId, signal, modelHint) {
    const b = await call('/videos/' + encodeURIComponent(nativeId), { method: 'GET' }, signal);
    const st = mapStatus(b?.status);
    return {
      nativeId, provider: 'grok', model: modelHint || MODEL(), status: st,
      progress: st === 'completed' ? 100 : Number(b?.progress || 0),
      seconds: Number(b?.duration || 0),
      detail: b?.error ? String(b.error?.message || b.error) : undefined,
      providerRequestId: nativeId,
    };
  },

  async download(nativeId, signal) {
    const b = await call('/videos/' + encodeURIComponent(nativeId), { method: 'GET' }, signal);
    if (mapStatus(b?.status) !== 'completed') throw new VideoProviderError('grok', 'xAI video is not ready', 409, true, 'not_ready');
    const url = videoUrl(b);
    if (!url) throw new VideoProviderError('grok', 'xAI response contained no video URL', 502, true, 'missing_output');
    const r = await fetch(url, { signal });
    if (!r.ok) throw new VideoProviderError('grok', `xAI video download failed (${r.status})`, r.status, r.status >= 500);
    return {
      bytes: new Uint8Array(await r.arrayBuffer()),
      contentType: r.headers.get('content-type') || 'video/mp4',
      filename: `scen-${nativeId}.mp4`,
    };
  },
};
