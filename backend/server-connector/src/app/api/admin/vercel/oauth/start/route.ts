import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../../lib/admin-auth';

const COOKIE_OPTS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'NEXT_PUBLIC_VERCEL_APP_CLIENT_ID is missing' }, { status: 500 });
  const state = crypto.randomBytes(32).toString('base64url');
  const nonce = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const callback = `${req.nextUrl.origin}/api/admin/vercel/oauth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    response_type: 'code',
    scope: 'openid email profile offline_access',
  });
  const res = NextResponse.redirect(`https://vercel.com/oauth/authorize?${params.toString()}`);
  res.cookies.set('scen_vercel_oauth_state', state, COOKIE_OPTS);
  res.cookies.set('scen_vercel_oauth_nonce', nonce, COOKIE_OPTS);
  res.cookies.set('scen_vercel_oauth_verifier', verifier, COOKIE_OPTS);
  return res;
}
