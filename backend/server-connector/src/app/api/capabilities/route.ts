import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/user-auth';
import { providerStatus } from '@/lib/ai/registry';
import { imageProviders } from '@/lib/image/registry';
import { videoProviders } from '@/lib/video/registry';
import { emailStatus } from '@/lib/email/config';
import { billingStatus } from '@/lib/billing/config';
import { dbHealth, db } from '@/lib/data/db';
import { storageHealth } from '@/lib/storage/s3';

export const dynamic = 'force-dynamic';

/**
 * What this workspace can actually do, for the Connections hub.
 *
 * The hub used to have no honest source: every per-provider status route is
 * behind requireAdmin(), so a normal customer's UI could only guess, and a
 * guessed "Connected" badge is worse than none. This answers the same question
 * for a signed-in user without being an admin surface.
 *
 * It returns booleans and provider ids only. No key, no endpoint, no
 * connection string, no environment value is ever included — a caller learns
 * that something is configured, never what it was configured with.
 */

type State = 'connected' | 'setup_required' | 'not_connected' | 'error' | 'unavailable';

/** Configured but unhealthy is a different problem from never set up. */
async function health(configured: boolean, probe: () => Promise<unknown>): Promise<State> {
  if (!configured) return 'not_connected';
  try { await probe(); return 'connected'; } catch { return 'error'; }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const ai = providerStatus().filter(p => p.configured).map(p => p.id);
    const images = imageProviders().filter(p => p.isConfigured()).map(p => p.id);
    const videos = videoProviders().filter(p => p.isConfigured()).map(p => p.id);
    const email = emailStatus();
    const billing = billingStatus() as Record<string, { configured: boolean }>;
    const payments = Object.keys(billing).filter(k => billing[k]?.configured);

    const googleConfigured = !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.SCEN_GOOGLE_REDIRECT_URI
    );

    const [dataState, storageState] = await Promise.all([
      health(!!process.env.DATABASE_URL, dbHealth),
      health(!!process.env.STORAGE_BUCKET, storageHealth),
    ]);

    // Domains are workspace data, not configuration. A host that is added but
    // still waiting on DNS is "setup required", not "connected" — the customer
    // has work left to do at their registrar.
    let domainCount = 0;
    let domainLive = 0;
    let domainState: State = dataState === 'connected' ? 'not_connected' : dataState;
    if (dataState === 'connected') {
      try {
        const sql = db();
        const rows = await sql`
          select count(*)::int as total,
                 count(*) filter (where status='live')::int as live
          from custom_domains where workspace_id=${user.workspaceId}`;
        domainCount = Number(rows[0]?.total || 0);
        domainLive = Number(rows[0]?.live || 0);
        if (domainLive > 0) domainState = 'connected';
        else if (domainCount > 0) domainState = 'setup_required';
      } catch { domainState = 'error'; }
    }

    return NextResponse.json({
      ok: true,
      capabilities: {
        ai:        { state: ai.length ? 'connected' : 'not_connected', providers: ai },
        images:    { state: images.length ? 'connected' : 'not_connected', providers: images },
        video:     { state: videos.length ? 'connected' : 'not_connected', providers: videos },
        data:      { state: dataState },
        auth:      { state: dataState, methods: googleConfigured ? ['email', 'google'] : ['email'] },
        storage:   { state: storageState },
        domain:    { state: domainState, count: domainCount, live: domainLive },
        payments:  { state: payments.length ? 'connected' : 'not_connected', providers: payments },
        email:     { state: email.configured ? 'connected' : 'not_connected', provider: email.provider },
        // Supported by the product surface, but this backend has no adapter for
        // them yet. Saying so beats rendering a Connect button that leads nowhere.
        analytics: { state: 'unavailable' as State },
        crm:       { state: 'unavailable' as State },
        github:    { state: 'unavailable' as State },
        webhooks:  { state: 'unavailable' as State },
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Capabilities unavailable' }, { status: e?.status || 500 });
  }
}
