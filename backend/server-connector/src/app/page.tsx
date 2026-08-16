export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main style={{ fontFamily: 'ui-sans-serif, system-ui', padding: 40, lineHeight: 1.6 }}>
      <h1>Scen Server Connector</h1>
      <p>This service exposes the Scen API only. The product UI is served separately.</p>
      <p>
        Readiness endpoints report which providers are configured. They never return secret
        values, and they are admin-guarded.
      </p>
      <ul>
        <li><code>/api/admin/ai/status</code></li>
        <li><code>/api/admin/image/status</code></li>
        <li><code>/api/admin/video/status</code></li>
        <li><code>/api/admin/billing/status</code></li>
        <li><code>/api/admin/auth-email/status</code></li>
        <li><code>/api/admin/data/status</code></li>
      </ul>
    </main>
  );
}
