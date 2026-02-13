# Domain + Canonical + SEO hardening

## 1) Add domain in Vercel

Add both:
- Apex: `jisway.com`
- WWW: `www.jisway.com`

Choose one as canonical (recommended: **www**).

## 2) DNS records (typical)

Your DNS provider will show the exact values. Common patterns:

- Apex (`jisway.com`)
  - `A` record to Vercel IP (or ALIAS/ANAME depending on provider)
- WWW (`www.jisway.com`)
  - `CNAME` to `cname.vercel-dns.com`

## 3) Enforce canonical host

Set env var in **Production**:
- `CANONICAL_HOST=www.jisway.com`

Behavior:
- Non-canonical hosts are redirected (308) to the canonical host.

## 4) Canonical URLs

Set:
- `APP_BASE_URL=https://www.jisway.com`

This is used by:
- `metadataBase` (canonical URL generation)
- `robots.txt` sitemap URL
- `sitemap.xml` absolute URLs
- Stripe success/cancel URLs

## 5) robots + sitemap

Verify in production:
- `https://www.jisway.com/robots.txt`
- `https://www.jisway.com/sitemap.xml`

## 6) Security headers

Configured in `next.config.ts`:
- HSTS (production only)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Minimal CSP (allows JSON-LD inline script and Stripe domains)

If you add additional third-party scripts later, update CSP accordingly.

