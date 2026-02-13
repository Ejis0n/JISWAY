# Email: Production (Resend)

## Required env vars

- `RESEND_API_KEY`
- `EMAIL_FROM`
  - Must be a verified sender/domain in Resend.

## Verify sending domain (Resend)

1. Add your domain in Resend.
2. Add the required DNS records (SPF/DKIM) in your DNS provider.
3. Verify the domain in Resend UI.
4. Set `EMAIL_FROM` to a sender on that domain, e.g.:
   - `JISWAY <no-reply@jisway.com>`

## Runtime constraints

- Email sending is only done from server code (API routes).
- If sending fails, the DB record is still created; the failure is logged.

## Operational note

For higher reliability, consider adding an external queue (e.g. Upstash QStash / Redis) later.

