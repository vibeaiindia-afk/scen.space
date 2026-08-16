import type { NextRequest } from 'next/server';
import { getVercelCredential } from './vercel-token';

const API = 'https://api.vercel.com';

export async function vercelFetch<T>(req: NextRequest, path: string, init: RequestInit = {}): Promise<T> {
  if (process.env.SCEN_VERCEL_CONNECTOR_ENABLED === 'false') {
    throw new Error('Scen Vercel connector is disabled');
  }
  const credential = await getVercelCredential(req);
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${credential.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body
      ? JSON.stringify((body as { error: unknown }).error)
      : String(body || `Vercel API ${res.status}`);
    throw new Error(message);
  }
  return body as T;
}

export function withTeam(path: string, teamId?: string): string {
  if (!teamId) return path;
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}teamId=${encodeURIComponent(teamId)}`;
}
