import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../../lib/admin-auth';
import { setVercelCredentialCookie } from '../../../../../../lib/vercel-token';

export async function GET(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const storedState = req.cookies.get('scen_vercel_oauth_state')?.value;
  const verifier = req.cookies.get('scen_vercel_oauth_verifier')?.value;
  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return NextResponse.json({ error: 'Invalid OAuth callback state' }, { status: 400 });
  }
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;
  if (!clientId) return NextResponse.json({ error: 'Vercel OAuth client ID missing' }, { status: 500 });
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    code_verifier: verifier,
    redirect_uri: `${req.nextUrl.origin}/api/admin/vercel/oauth/callback`,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const tokenRes = await fetch('https://api.vercel.com/login/oauth/token', { method: 'POST', body, cache: 'no-store' });
  const token = await tokenRes.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error?: unknown };
  if (!tokenRes.ok || !token.access_token) {
    return NextResponse.json({ error: token.error || 'Vercel OAuth token exchange failed' }, { status: 502 });
  }
  const res = NextResponse.redirect(new URL('/admin?view=integrations&vercel=connected', req.url));
  setVercelCredentialCookie(res, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + Math.max(60, token.expires_in || 3600) * 1000,
    source: 'oauth',
  });
  for (const name of ['scen_vercel_oauth_state','scen_vercel_oauth_nonce','scen_vercel_oauth_verifier']) {
    res.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
  return res;
}
