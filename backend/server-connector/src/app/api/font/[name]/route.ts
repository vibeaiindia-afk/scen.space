import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Serves a webfont with the CORS header its own host does not send.
 *
 * Fonts are always fetched in CORS mode, so a file served without
 * Access-Control-Allow-Origin cannot be used by any site but the one it was
 * uploaded for — the browser downloads it and then throws it away.
 *
 * The names are a fixed map rather than a ?src= parameter on purpose: a proxy
 * that fetches a caller-supplied URL is an SSRF hole, and nothing here needs
 * one.
 */
const FONTS: Record<string, { url: string; type: string }> = {
  'ogg-medium.woff2': {
    url: 'https://dcym8fthxf5uu.cloudfront.net/fonts/247a073c-29f5-4a89-aa3a-741020f346fc/OggText-Medium.woff2',
    type: 'font/woff2',
  },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Timing-Allow-Origin': '*',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const font = FONTS[String(name || '').toLowerCase()];
  if (!font) {
    return NextResponse.json({ error: 'Unknown font' }, { status: 404, headers: CORS });
  }
  try {
    const upstream = await fetch(font.url, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Font source returned ${upstream.status}` },
        { status: 502, headers: CORS },
      );
    }
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': font.type,
        'Content-Length': String(body.byteLength),
        // the file is immutable at its source, so let the browser keep it
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Font fetch failed';
    return NextResponse.json({ error: message }, { status: 502, headers: CORS });
  }
}
