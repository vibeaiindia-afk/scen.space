import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { getAsset } from '@/lib/data/assets';
import { signGet } from '@/lib/storage/s3';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

const SYSTEM = [
  'You read a screenshot or mockup of a website and describe it as structured content.',
  'Reply with JSON only — no prose, no code fence.',
  'Shape: {"projectName":string,"heroTitle":string,"heroSubtitle":string,',
  '"palette":{"accent":string,"accent2":string},',
  '"sections":[{"name":string,"copy":string}],',
  '"ctas":[string],"heroVisual":string}',
  'Read the actual words in the image where they are legible and reuse them.',
  'heroTitle is the largest headline. sections are the real content blocks you can',
  'see, 4 to 7 of them, name is 1-2 words and copy is one sentence.',
  'ctas are the button labels you can read. palette values are hex colours sampled',
  'from the design.',
  'heroVisual describes the photograph used behind the headline — subject, setting,',
  'light and camera angle in one sentence. Describe only what is happening in that',
  'photograph. Never mention the web page, its layout, text, buttons or interface,',
  'because this sentence is fed to an image generator and must not produce another',
  'picture of a website.',
  'Plain text only.',
].join(' ');

/**
 * Turns a picture of a website into editable structure.
 *
 * A generated mockup is only pixels — its buttons cannot be clicked. Reading it
 * with a vision model gives back real sections and copy, which the builder then
 * renders as actual components.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}));
    const assetId = String(body?.assetId || '');
    if (!assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });

    const asset = await getAsset(user, assetId);
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const signed = await signGet(asset.object_key, asset.original_name || undefined);
    const res = await fetch(signed);
    if (!res.ok) {
      return NextResponse.json({ error: `Could not read the image (HTTP ${res.status})` }, { status: 502 });
    }
    const mime = asset.mime_type || 'image/png';
    const dataUri = `data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;

    const model = process.env.SCEN_OPENAI_VISION_MODEL || process.env.SCEN_OPENAI_MODEL || 'gpt-5.6';
    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [
          { role: 'developer', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: String(body?.hint || 'Describe this website design as structured content.') },
              { type: 'input_image', image_url: dataUri },
            ],
          },
        ],
      }),
    });
    const out = await ai.json().catch(() => ({}));
    if (!ai.ok) {
      const message = out?.error?.message || `Vision request failed (HTTP ${ai.status})`;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    let text = typeof out?.output_text === 'string' ? out.output_text : '';
    if (!text) {
      const parts: string[] = [];
      for (const item of out?.output || []) {
        for (const c of item?.content || []) if (typeof c?.text === 'string') parts.push(c.text);
      }
      text = parts.join('\n').trim();
    }
    return NextResponse.json({ text, model }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vision failed';
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
