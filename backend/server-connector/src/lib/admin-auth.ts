import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

export type AdminRole = 'owner' | 'admin';
export type AdminSession = { sub: string; role: AdminRole; exp: number };
export const ADMIN_COOKIE = 'scen_admin_session';

export class AdminAuthError extends Error {
  status = 401;
}

function secret(): string {
  const value = process.env.SCEN_ADMIN_SESSION_SECRET;
  if (!value || value.length < 24) {
    throw new AdminAuthError('SCEN_ADMIN_SESSION_SECRET is missing or too short');
  }
  return value;
}

function sign(body: string): string {
  return crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}

export function createAdminSessionCookie(session: AdminSession): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function requireAdmin(req: NextRequest): AdminSession {
  const raw = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!raw) throw new AdminAuthError('Admin session required');
  const [body, supplied] = raw.split('.');
  if (!body || !supplied) throw new AdminAuthError('Invalid admin session');
  const expected = sign(body);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AdminAuthError('Invalid admin session signature');
  }
  let session: AdminSession;
  try {
    session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new AdminAuthError('Invalid admin session payload');
  }
  if (!session.exp || session.exp <= Math.floor(Date.now() / 1000)) {
    throw new AdminAuthError('Admin session expired');
  }
  if (!['owner', 'admin'].includes(session.role)) {
    throw new AdminAuthError('Admin role required');
  }
  return session;
}

/**
 * Guard for handlers that call requireAdmin outside a try/catch. Returns a
 * response to send when access is denied, or null to continue. Throwing past
 * the handler turns a plain 401 into an opaque 500.
 */
export function adminGuard(req: NextRequest): NextResponse | null {
  try {
    requireAdmin(req);
    return null;
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 401;
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
