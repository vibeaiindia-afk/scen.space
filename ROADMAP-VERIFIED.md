# Scen — Verified Roadmap Included

This MASTER package contains the latest cumulative **Scen** website. Every roadmap
flow below is present in `index.html`; the historical per-flow HTML snapshots were
removed from the package so they are not exposed by a public deploy.

## Flow 1 — Commerce + Bookings + Localization
Included in `index.html`:
- Store products, inventory, draft/active status
- Cart, quantity controls, tax, shipping, free-shipping threshold
- Checkout contact/address/demo payment/order confirmation/recent orders
- Booking services, duration/pricing, dates, slots, client details, upcoming bookings
- Booking buffer, lead time, timezone
- English/Hindi/French/Arabic localization, browser detection, localized URLs
- Analytics events and local event stream
- Cookie/privacy center
- Custom head/body/embed/CSS code
- Full project settings and publish QA

## Flow 2 — Product Ops
Included in `index.html`:
- Product Detail Page builder
- Product variants/options
- Inventory manager and history
- Cart drawer on builder canvas
- Booking month/agenda calendar
- Per-page multilingual editing
- Conversion funnel builder
- Redirects + custom 404 manager
- Backup/import/restore project JSON

## Flow 3 — Commerce Ops / Memberships
Included in the latest cumulative `index.html`:
- Checkout customization
- Order management
- Coupons/discounts
- Shipping zones and tax rules
- Transactional email template editor
- Booking availability rules / blackout dates
- Membership tiers and gated pages
- User accounts and saved favorites
- Final production-oriented dashboard/QA flows

## Backend foundations already included
See `backend/server-connector/`:
- AI text/code gateway
- Image generation gateway
- Video generation gateway
- PostgreSQL-compatible database
- S3-compatible storage
- Cashfree + Stripe + Razorpay billing/credits architecture
- Authentication + Google OIDC + sessions
- Transactional email adapters/templates
- Vercel integration architecture

## Final production note
Provider credentials are intentionally not bundled. Real AI/payment/calendar/email/database/storage credentials must be configured server-side using `.env.example` / Vercel environment variables.
