# Deployment notes

The frontend in this package is a self-contained static HTML product build.
The backend connector is a separate production-oriented server foundation and requires server-side environment variables plus provider/database credentials before real external actions can run.

Recommended production flow:

1. Keep the Scen frontend and backend source under version control.
2. Configure real secrets only in server-side/Vercel environment variables.
3. Run database migrations before enabling database-backed features.
4. Configure OAuth callback URLs for `scen.space`.
5. Configure Stripe/Razorpay webhook URLs and signing secrets before granting billing entitlements.
6. Verify transactional email sender/domain configuration.
7. Test Preview first, then promote to Production.
