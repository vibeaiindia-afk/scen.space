import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Public submission endpoint behind the /report-abuse page — no auth required. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || '').trim().slice(0, 200);
  const targetUrl = String(body?.targetUrl || '').trim().slice(0, 500);
  const description = String(body?.description || '').trim().slice(0, 4000);
  if (!description) {
    return NextResponse.json({ error: 'A description is required' }, { status: 400 });
  }
  try {
    const sql = db();
    const id = 'abuse_' + crypto.randomUUID();
    await sql`
      insert into abuse_reports(id, reporter_email, target_url, description)
      values(${id}, ${email || null}, ${targetUrl || null}, ${description})`;
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not submit report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
