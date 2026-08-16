import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireUser } from '@/lib/user-auth';
import { db } from '@/lib/data/db';
import { ensurePrincipal } from '@/lib/data/principals';

export const dynamic = 'force-dynamic';

/**
 * GET is dual-purpose:
 *   ?workspaceId=…  public storefront catalogue (active products only)
 *   no query        the signed-in merchant's own catalogue
 * Either way the rows are scoped to one workspace — a caller can never read
 * another tenant's catalogue by omitting a filter.
 */
export async function GET(req: NextRequest) {
  try {
    const sql = db();
    const publicWs = req.nextUrl.searchParams.get('workspaceId');
    if (publicWs) {
      const rows = await sql`select id,name,price_minor,currency,stock,category from store_products
                             where workspace_id=${publicWs} and status='active' order by created_at desc limit 200`;
      return NextResponse.json({ products: rows }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const u = await requireUser(req);
    const rows = await sql`select id,name,sku,price_minor,currency,stock,status,category,created_at
                           from store_products where workspace_id=${u.workspaceId} order by created_at desc limit 500`;
    return NextResponse.json({ products: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list products' }, { status: e?.status || 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser(req);
    await ensurePrincipal(u);
    const b = await req.json();
    const name = String(b?.name || '').trim();
    const priceMinor = Math.round(Number(b?.priceMinor));
    if (!name) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    if (!Number.isInteger(priceMinor) || priceMinor < 0) return NextResponse.json({ error: 'priceMinor must be a non-negative integer (paise)' }, { status: 400 });

    const sql = db();
    const id = String(b?.id || '').trim() || 'prd_' + crypto.randomUUID();
    const stock = Math.max(0, Math.floor(Number(b?.stock || 0)));
    const status = b?.status === 'draft' ? 'draft' : 'active';

    await sql`insert into store_products(id,workspace_id,name,sku,price_minor,currency,stock,status,category)
              values(${id},${u.workspaceId},${name},${String(b?.sku || '') || null},${priceMinor},${String(b?.currency || 'INR')},${stock},${status},${String(b?.category || '') || null})
              on conflict(id) do update set
                name=excluded.name, sku=excluded.sku, price_minor=excluded.price_minor,
                stock=excluded.stock, status=excluded.status, category=excluded.category, updated_at=now()
              where store_products.workspace_id=${u.workspaceId}`;

    const r = await sql`select id,name,sku,price_minor,currency,stock,status,category from store_products where id=${id} and workspace_id=${u.workspaceId}`;
    return NextResponse.json({ product: r[0] || null }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save product' }, { status: e?.status || 400 });
  }
}
