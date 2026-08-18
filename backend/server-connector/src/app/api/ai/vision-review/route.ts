import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { redact } from '@/lib/ai/safe';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Looks at a picture and says what is wrong with it.
 *
 * vision-site already reads a screenshot, but it reads it as content: it
 * answers "what does this page say", which is what an import needs. This
 * answers "is this any good", which is what §16–§18 of the build standard
 * needs — the studio screenshots its own preview and asks before it calls a
 * build finished, and asks again of each generated photograph before it keeps
 * it.
 *
 * The image arrives inline as a data URI. Storing a screenshot to ask one
 * question about it would leave the client's unfinished work sitting in their
 * asset library, and there is no upload route that would take it anyway.
 */
const PAGE_SYSTEM = [
  'You are a design director looking at a screenshot of one web page.',
  'Reply with JSON only — no prose, no code fence.',
  'Shape: {"scores":{"hierarchy":0,"typography":0,"composition":0,"originality":0,',
  '"brandFit":0,"spacing":0,"premium":0},"worst":"one key from scores",',
  '"problems":["at most three, each one short and specific about what you can see"],',
  '"fixes":["at most two, from the list the user gives you, exactly as written"],',
  '"verdict":"one plain sentence about this page"}',
  'Score honestly and score low where it deserves it. A page that could belong to ten',
  'unrelated businesses is not above 6 for originality. Sections that all share one',
  'layout are not above 6 for composition. Everything at a similar size is not above 6',
  'for typography and hierarchy.',
  'Judge only what is visible in the image.',
].join(' ');

const PHOTO_SYSTEM = [
  'You are a photo editor deciding whether one generated image can be published on a',
  'client website. Reply with JSON only — no prose, no code fence.',
  'Shape: {"usable":true|false,"score":0,"faults":["short, specific"],',
  '"reshoot":"one sentence describing what to generate instead, or empty"}',
  'Reject: visible text, watermarks, logos, interface elements, broken anatomy, wrong',
  'number of fingers or limbs, melted or impossible objects, obvious compositing seams,',
  'plastic-looking skin, illegible clutter where the headline will sit.',
  'Do not reject a picture merely for being simple or dark. reshoot must describe the',
  'photograph, never the web page.',
].join(' ');

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });

    const body = await req.json().catch(() => ({}));
    const image = String(body?.image || '');
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) {
      return NextResponse.json({ error: 'image must be a png, jpeg or webp data URI' }, { status: 400 });
    }
    /* ~6MB of base64 is the point where the model call is slower than it is
       useful; the studio sends a downscaled shot well under this. */
    if (image.length > 6_000_000) {
      return NextResponse.json({ error: 'The screenshot is too large to review' }, { status: 413 });
    }
    const mode = body?.mode === 'photo' ? 'photo' : 'page';
    const hint = String(body?.hint || '').slice(0, 4000);

    const model = process.env.SCEN_OPENAI_VISION_MODEL || process.env.SCEN_OPENAI_MODEL || 'gpt-5.6';
    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: [
          { role: 'developer', content: mode === 'photo' ? PHOTO_SYSTEM : PAGE_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: hint || 'Review this.' },
              { type: 'input_image', image_url: image },
            ],
          },
        ],
      }),
    });
    const out = await ai.json().catch(() => ({}));
    if (!ai.ok) {
      const message = out?.error?.message || `Vision request failed (HTTP ${ai.status})`;
      return NextResponse.json({ error: redact(message) }, { status: 502 });
    }
    const text =
      typeof out?.output_text === 'string' && out.output_text.trim()
        ? out.output_text
        : (out?.output || [])
            .flatMap((o: any) => o?.content || [])
            .map((c: any) => c?.text || '')
            .join('')
            .trim();
    return NextResponse.json(
      { text, provider: 'openai', model, mode },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: redact(e?.message || 'Vision review failed'), code: e?.code || 'vision_error' },
      { status: e?.status || 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
