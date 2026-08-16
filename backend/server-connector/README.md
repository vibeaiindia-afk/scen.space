# Scen — Real AI Text & Code Gateway

This kit extends the existing Admin → Vercel connector with a server-only multi-provider AI gateway.

## Included providers
- OpenAI — Responses API (`OPENAI_API_KEY`), `store:false` by default.
- Anthropic — Messages API (`ANTHROPIC_API_KEY`).
- Gemini — `generateContent` (`GEMINI_API_KEY`).

All model IDs are environment configuration. Update them without editing adapter code.

## Routes
- `GET /api/admin/ai/status` — admin-only readiness, models, routes, limits; never returns secret values.
- `POST /api/admin/ai/providers/test` — admin-only provider health test.
- `POST /api/ai/generate` — authenticated app user unified text/code generation route.

## Request shape
```json
{ "feature": "chat", "input": "Build a premium hero concept" }
```
Supported features: `chat`, `code`, `planning`, `analysis`.

## Routing
The route is selected with `SCEN_AI_<FEATURE>_PRIMARY` and optional `_FALLBACK`. Fallback happens only for retryable provider errors such as 429, provider 5xx, timeout or empty provider output.

## Security defaults
1. Provider keys never go to browser JavaScript.
2. No raw key is stored in localStorage.
3. User requests require a signed tenant-scoped server session cookie by default.
4. `SCEN_AI_ALLOW_DEV_ANON=true` works only outside production and is intentionally opt-in.
5. Request input size, output tokens and provider timeouts have hard ceilings.
6. There is no deployment route in this package.

## Production follow-up
Use your production database/ledger for distributed rate limits, budget reservation/commit/release and durable usage logs. The adapter response already exposes provider/model/token usage for that sink.

## Vercel
Add provider secrets from Scen Admin through the real Vercel connector once a Vercel project exists. Environment-variable changes and application deployment remain separate operations.


## Real Image Generation Gateway

Added routes:
- `GET /api/admin/image/status` — admin-only configuration status; never returns secret values.
- `POST /api/admin/image/providers/test` — lightweight auth/model check; **does not generate a paid image**.
- `POST /api/image/generate` — signed-user generate/edit route with OpenAI → Gemini → optional Replicate rescue routing.

Provider defaults:
- OpenAI: `gpt-image-2` via `/v1/images/generations` and `/v1/images/edits`.
- Gemini: `gemini-3.1-flash-image` via the Interactions API.
- Replicate: configurable official model rescue; generic adapter is generation-only because edit schemas vary by model.

Reference image inputs are base64-only in this kit so the server does not fetch arbitrary user-supplied URLs (avoids SSRF). Configure byte/count ceilings in `.env.example`.

Generated outputs can be handed to `SCEN_ASSET_INGEST_URL`. If no storage hook is configured, outputs are returned directly and the later storage flow can replace this contract.

No deployment route is included.

## Video gateway
Adds `/api/video/jobs` and signed async job polling/content routes. Provider keys stay server-side. Configure `SCEN_VIDEO_JOB_SECRET` and provider model variables from `.env.example`. The included routes do not deploy or create Vercel projects.


## Database + Storage Foundation

- Configure `DATABASE_URL` for a PostgreSQL-compatible database.
- Configure the `STORAGE_*` variables for a private S3-compatible bucket.
- Apply bundled migrations only through the Owner-guarded migration endpoint or your normal CI migration process.
- Project and scene queries are always scoped by `workspaceId` from the signed `scen_user_session`; client-supplied tenant IDs are ignored.
- Direct uploads use a tenant-bound HMAC completion token and presigned PUT.
- Generated image/video bytes are written through the same storage adapter and indexed in `assets`.
- Physical object cleanup is intentionally separate from soft delete so recovery windows can be honored.
- No deployment endpoint is present.


## Payments + Credits

This kit adds Razorpay + Stripe server adapters and a database-backed credit wallet.

Trust boundary:
1. The browser requests checkout; it never receives provider secret keys.
2. The provider hosts/handles payment authorization.
3. Success/cancel redirects are UX only and never grant credits.
4. Verified webhooks write idempotent billing events and grant subscription/top-up entitlements.
5. AI/media generation reserves credits before provider work, commits on success, and releases on failure.
6. Manual adjustments require an Owner admin session and write an audit event.

Before live use, configure the provider keys/plan IDs in Vercel environment variables, apply migration 004, register both public HTTPS webhook endpoints, and run provider sandbox/test-mode transactions. No deployment endpoint is included in this kit.


## Authentication + transactional email
This revision adds database-backed opaque user sessions, email/password signup/login, Google OIDC with PKCE/state, email verification, password reset, workspace invitations, device/session revocation, and Resend/Postmark transactional email adapters. Apply migration `005_auth_email.sql` before enabling these routes. No deploy endpoint is included.
