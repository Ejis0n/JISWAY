import Link from "next/link";

export const metadata = { title: "Terms | JISWAY" };

export default function TermsPolicyPage() {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>
        These Terms govern your use of JISWAY. By placing an order or submitting a quote request, you agree to these
        Terms.
      </p>

      <h2>Business model (no inventory)</h2>
      <ul>
        <li>
          JISWAY does not hold local stock. Items are procured after payment confirmation (or after quote approval for
          invoice orders).
        </li>
        <li>
          Procurement and handling may require processing time before shipment. Estimated delivery windows exclude
          customs delays.
        </li>
      </ul>

      <h2>No substitutes (exact JIS spec only)</h2>
      <ul>
        <li>We ship the exact specification shown on the product page and in your order summary.</li>
        <li>No substitutes, no “close match” replacements, and no spec changes after procurement starts.</li>
      </ul>

      <h2>Taxes, duties, and customs</h2>
      <ul>
        <li>Import duties and taxes are the responsibility of the recipient.</li>
        <li>Customs delays are not grounds for cancellation, chargebacks, or refunds.</li>
      </ul>

      <h2>Address accuracy</h2>
      <ul>
        <li>You are responsible for providing an accurate shipping address.</li>
        <li>If re-shipment is required due to an address error, re-shipment costs may be billed to you.</li>
      </ul>

      <h2>Payments</h2>
      <ul>
        <li>Stripe card payments are available for eligible orders under the quote threshold.</li>
        <li>Quote/invoice orders (wire/USDT) are generally final sale except where we shipped the incorrect item.</li>
      </ul>

      <h2>Disputes</h2>
      <ul>
        <li>
          For issues (damage, loss, wrong item), please open a support ticket promptly and provide evidence (photos,
          tracking details).
        </li>
      </ul>

      <h2>Governing law / venue</h2>
      <p>These Terms are governed by the laws of Japan, and disputes shall be handled in Japan.</p>

      <p>
        Related:{" "}
        <Link href="/policies/refund">Refund Policy</Link>,{" "}
        <Link href="/policies/shipping">Shipping Policy</Link>,{" "}
        <Link href="/policies/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}

