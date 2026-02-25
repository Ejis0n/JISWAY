# ENV: Production matrix (Vercel)

This project reads environment variables from **Vercel Environment Variables** (Preview + Production).

## Required (Production)

- `DATABASE_URL`
  - Managed Postgres connection string (Neon/Supabase).

- `APP_BASE_URL`
  - Canonical base URL, e.g. `https://www.jisway.com`
  - Used for sitemap/canonicals and Stripe redirect URLs.

- `NEXTAUTH_URL`
  - Must match your deployed base URL, e.g. `https://www.jisway.com`

- `NEXTAUTH_SECRET`
  - Generate a strong secret (32+ chars).

- `STRIPE_SECRET_KEY`
  - Live secret key (`sk_live_...`) in production.

- `STRIPE_WEBHOOK_SECRET`
  - Webhook signing secret for your endpoint.

- `RESEND_API_KEY` (or SMTP vars if you implement SMTP)
  - For sending quote/invoice emails.

- `EMAIL_FROM`
  - Verified sender, e.g. `JISWAY <no-reply@jisway.com>`

- `ADMIN_EMAIL`
  - Address that receives admin notifications: new quote requests, new customer offers, payment/webhook alerts.
  - Example: `jisway-contact@officet2.jp`  
  - If unset, those notifications are skipped (no error).

## Optional (Production)

- `CANONICAL_HOST`
  - If set, requests with other hosts are redirected (308) to this host.
  - Example: `www.jisway.com`

- `STRIPE_PUBLISHABLE_KEY`
  - Not required by current UI (Checkout redirects server-side), but recommended to store for future client usage.

- `USDT_TRC20_ADDRESS`
  - Used to prefill instructions text for USDT invoices in admin.

## Seed-only (Production)

These are read by `prisma db seed` to create the initial admin user **if missing**.

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

Notes:
- Password is hashed with bcrypt and stored as `User.passwordHash`.
- Seed does **not** overwrite existing admin password in production.

## Preview vs Production (Vercel)

- **Preview**: can use Stripe test keys and a preview DB.
- **Production**: use Live Stripe keys and the production DB.

Recommended:
- Set `DATABASE_URL`, `APP_BASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `STRIPE_*`, `RESEND_*` separately for Preview and Production.

## Local dev defaults

See `.env.example` for local defaults.

