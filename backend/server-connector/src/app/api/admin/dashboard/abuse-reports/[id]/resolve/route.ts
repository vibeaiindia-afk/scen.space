import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { db } from '@/lib/data/db';

export const dynamic = 'force-dynamic';

/** Marks one abuse report resolved. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const id = String(params.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Report id required' }, { status: 400 });
  try {
    const sql = db();
    const rows = await sql`
      update abuse_reports set status = 'resolved', resolved_at = now()
      where id = ${id}
      returning id, status, resolved_at as "resolvedAt"`;
    if (!rows.length) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ report: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resolve failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
