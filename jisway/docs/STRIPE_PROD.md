# Stripe: Production checklist

## 1) Switch to Live keys

- Set `STRIPE_SECRET_KEY` to `sk_live_...` in **Vercel Production** env.
- Set `STRIPE_WEBHOOK_SECRET` to the signing secret from your production webhook endpoint.
- (Optional) Set `STRIPE_PUBLISHABLE_KEY` to `pk_live_...`.

## 2) Webhook endpoint

Create a webhook endpoint in Stripe Dashboard:

- Endpoint URL: `https://<your-domain>/api/stripe/webhook`

Subscribe to events:
- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `invoice.paid` (if using Stripe Invoicing for approved quotes)
- `invoice.payment_failed`
- `charge.dispute.created` (chargeback defense: record dispute, link to order)
- `charge.dispute.closed` (chargeback defense: update status)

Notes:
- Signature verification is implemented with `STRIPE_WEBHOOK_SECRET`.
- Handler is **idempotent** by storing `StripeEvent.id` and ignoring duplicates.
- Webhook route is forced to **Node runtime** (`runtime = "nodejs"`).

## 3) Test in dev with Stripe CLI (Test mode)

In local dev (test keys):
- Forward webhooks to your local server:
  - `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`.

Trigger events:
- `stripe trigger checkout.session.completed`

## 4) Live verification

Recommended minimal live verification:
- Create a $1 order (or the smallest allowed order).
- Confirm:
  - Checkout redirects back to `/?success=1`
  - Webhook updates `Order.status = paid`
  - `/admin/health` shows recent webhook timestamp

