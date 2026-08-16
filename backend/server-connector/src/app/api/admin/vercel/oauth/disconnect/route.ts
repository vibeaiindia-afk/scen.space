import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '../../../../../../lib/admin-auth';
import { clearVercelCredentialCookie, getVercelCredential } from '../../../../../../lib/vercel-token';

export async function POST(req: NextRequest) {
  const denied = adminGuard(req);
  if (denied) return denied;
  try {
    const credential = await getVercelCredential(req);
    const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
    const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;
    if (credential.source === 'oauth' && clientId && clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      await fetch('https://api.vercel.com/login/oauth/token/revoke', {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}` },
        body: new URLSearchParams({ token: credential.accessToken }),
        cache: 'no-store',
      });
    }
  } catch { /* clearing local encrypted credential remains safe */ }
  const res = NextResponse.json({ ok: true });
  clearVercelCredentialCookie(res);
  return res;
}
