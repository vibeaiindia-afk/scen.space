import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const VERCEL_CREDENTIAL_COOKIE = 'scen_vercel_credential';

type StoredCredential = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  source: 'oauth' | 'server-token';
};

function encryptionKey(): Buffer {
  const raw = process.env.SCEN_CONNECTOR_ENCRYPTION_KEY;
  if (!raw || raw.length < 24) throw new Error('SCEN_CONNECTOR_ENCRYPTION_KEY is missing or too short');
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decrypt(value: string): string {
  const [version, ivB64, tagB64, dataB64] = value.split('.');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted credential');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}

function decodeCredential(raw: string): StoredCredential {
  return JSON.parse(decrypt(raw)) as StoredCredential;
}

async function refreshOAuthCredential(credential: StoredCredential): Promise<StoredCredential> {
  if (!credential.refreshToken) return credential;
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;
  if (!clientId) return credential;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: credential.refreshToken,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const res = await fetch('https://api.vercel.com/login/oauth/token', { method: 'POST', body, cache: 'no-store' });
  if (!res.ok) return credential;
  const next = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
  return {
    accessToken: next.access_token,
    refreshToken: next.refresh_token || credential.refreshToken,
    expiresAt: Date.now() + Math.max(60, next.expires_in || 3600) * 1000,
    source: 'oauth',
  };
}

export async function getVercelCredential(req: NextRequest): Promise<StoredCredential> {
  const cookie = req.cookies.get(VERCEL_CREDENTIAL_COOKIE)?.value;
  if (cookie) {
    const credential = decodeCredential(cookie);
    if (credential.expiresAt && credential.expiresAt < Date.now() + 60_000) {
      return refreshOAuthCredential(credential);
    }
    return credential;
  }
  const fallback = process.env.VERCEL_ADMIN_TOKEN;
  if (fallback) return { accessToken: fallback, source: 'server-token' };
  throw new Error('No Vercel credential configured');
}

export function setVercelCredentialCookie(
  res: NextResponse,
  credential: StoredCredential,
  maxAgeSeconds = 60 * 60 * 24 * 30,
) {
  res.cookies.set(VERCEL_CREDENTIAL_COOKIE, encrypt(JSON.stringify(credential)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearVercelCredentialCookie(res: NextResponse) {
  res.cookies.set(VERCEL_CREDENTIAL_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
