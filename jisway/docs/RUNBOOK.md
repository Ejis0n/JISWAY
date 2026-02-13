# JISWAY v1 — Deployment runbook (Vercel + Neon + Stripe)

## 0) Prereqs

- Stripe account (Live + Test)
- Vercel account
- Neon account (or Supabase)
- Resend account + verified domain

## 1) Create managed Postgres (Neon)

1. Create a Neon project + database.
2. Copy the connection string as `DATABASE_URL`.
3. Ensure it includes `?sslmode=require` if Neon requires it.

## 2) Create Vercel project

1. Import the Git repo into Vercel.
2. Framework: Next.js.
3. Set Node version >= 20 (matches `package.json` engines).

## 3) Set Vercel Environment Variables

In **Production**:
- `DATABASE_URL`
- `APP_BASE_URL` (e.g. `https://www.jisway.com`)
- `NEXTAUTH_URL` (same as base URL)
- `NEXTAUTH_SECRET`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- (optional) `CANONICAL_HOST=www.jisway.com`

In **Preview**:
- Use separate test DB + Stripe test keys.

See `docs/ENV_PRODUCTION.md` for full list and notes.

## 4) Apply Prisma migrations (production)

This project uses migrations. Do **not** use `prisma db push` in production.

Option A (recommended): run migrate deploy in CI/one-off job
- `npm run db:migrate:deploy`

Option B: run locally against prod DB (careful with env)
- Set `DATABASE_URL` to prod
- `npm run db:migrate:deploy`

## 5) Seed safely (admin + catalog)

Seed is non-destructive in production:
- creates admin if missing
- upserts products/variants

Run:
- `npm run db:seed`

After seeding:
- Remove `ADMIN_SEED_PASSWORD` from Vercel env (optional hardening).

## 6) Configure Stripe webhooks

1. Create endpoint:
   - `https://www.jisway.com/api/stripe/webhook`
2. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `charge.dispute.created` (chargeback defense)
   - `charge.dispute.closed` (chargeback defense)
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`.
4. Verify `/admin/health` shows last webhook timestamp after a test.

Stripe descriptor and receipt: see `docs/STRIPE_DESCRIPTOR.md` and `docs/STRIPE_PROD.md`.

## 7) Verify end-to-end

1. Browse product → add to cart.
2. Subtotal < 300: Checkout works (Stripe redirect → `/?success=1`).
3. Subtotal >= 300: Checkout hidden → Quote required.
4. Admin:
   - Review quote
   - Approve with Wire/USDT → `/invoice/[token]` works
5. Shipping: `/admin/shipping` — zones/rules; checkout uses `/api/shipping/quote`.
6. Dispute evidence: Admin order detail → "Generate Stripe Evidence" → PDF; see `docs/DISPUTE_PLAYBOOK.md`.

## 8) Domain setup

1. Add domain in Vercel (apex + www).
2. Update DNS records.
3. Set:
   - `APP_BASE_URL=https://www.jisway.com`
   - `CANONICAL_HOST=www.jisway.com`
4. Verify:
   - `/robots.txt`
   - `/sitemap.xml`

## 9) Google Search Console

1. Add property for canonical host.
2. Submit sitemap:
   - `https://www.jisway.com/sitemap.xml`

## v1 docs (reference)

- Shipping: `docs/SHIPPING_ENGINE.md`
- Dispute prevention: `docs/DISPUTE_PREVENTION.md`, `docs/DISPUTE_PLAYBOOK.md`, `docs/EVIDENCE_SCHEMA.md`
- Policies / copy: `docs/POLICY_COPY_GUIDE.md`
- Stripe: `docs/STRIPE_DESCRIPTOR.md`, `docs/STRIPE_PROD.md`
- Env: `docs/ENV_PRODUCTION.md`

