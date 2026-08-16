# Scen — Complete Website Source

Scen is a cinematic 3D AI website builder: **Prompt → 3D World → Website**.

## Included

- `index.html` — the complete branded Scen product UI. This is the single frontend source.
- `backend/server-connector/` — cumulative production-oriented backend foundation:
  - Vercel integration architecture
  - AI text/code gateway
  - Image generation gateway
  - Video generation jobs gateway
  - PostgreSQL-compatible database foundation
  - S3-compatible storage foundation
  - Cashfree + Stripe + Razorpay billing/credits architecture
  - Authentication, Google OIDC and session architecture
  - Transactional email adapters/templates
- `manifests/` — feature manifests.
- `START-HERE.txt` — quick start.

## Local frontend preview

On macOS, double-click `start-local.command`, then open:

`http://localhost:8765`

Alternatively:

```bash
python3 -m http.server 8765
```

## Backend setup

Open `backend/server-connector/README.md` and copy `.env.example` to your server-side environment configuration.

**Do not put real API keys in frontend code or commit `.env` files.**

The public product/domain remains `scen.space`; the visible brand name is **Scen**.
