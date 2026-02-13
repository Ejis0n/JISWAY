import Link from "next/link";

export const metadata = { title: "Refund Policy | JISWAY" };

export default function RefundPolicyPage() {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Refund Policy</h1>
      <p>This policy is designed to be clear and fair for international procurement of industrial fasteners.</p>

      <h2>Core principles</h2>
      <ul>
        <li>
          <strong>No inventory</strong>: items are procured after payment confirmation. Processing begins immediately.
        </li>
        <li>
          <strong>No substitutes</strong>: exact JIS specification only.
        </li>
        <li>
          <strong>Recipient pays duties/taxes</strong>. Customs delays are not refundable.
        </li>
      </ul>

      <h2>Misorder (wrong size/length/spec selected)</h2>
      <ul>
        <li>You are responsible for selecting the correct specification (size/length/pack/finish).</li>
        <li>
          We do not accept returns or refunds for “ordered the wrong spec” unless our listing/specification was
          incorrect.
        </li>
      </ul>

      <h2>Wrong item shipped (our error)</h2>
      <ul>
        <li>If we shipped an item that does not match the order specification, we will replace or refund.</li>
        <li>
          You must open a support ticket within <strong>7 days</strong> of delivery.
        </li>
      </ul>

      <h2>Damage in transit</h2>
      <ul>
        <li>
          For damage claims, provide photos of the outer packaging and the item within <strong>7 days</strong> of
          delivery.
        </li>
        <li>We may request additional photos or carrier documentation.</li>
      </ul>

      <h2>Lost shipment / non-delivery</h2>
      <ul>
        <li>
          If tracking indicates non-delivery, open a case after <strong>14 business days</strong> past the estimated
          delivery window.
        </li>
        <li>
          If the carrier confirms the shipment is lost, we will either resend or refund (at our discretion) after the
          carrier’s claim process.
        </li>
      </ul>

      <h2>Customs delays</h2>
      <ul>
        <li>Customs delays are not grounds for refunds or chargebacks.</li>
      </ul>

      <h2>Payment method differences</h2>
      <ul>
        <li>
          <strong>Stripe (card)</strong>: eligible for the remedies described above.
        </li>
        <li>
          <strong>Quote / wire / USDT</strong>: generally final sale, except if we shipped the incorrect item.
        </li>
      </ul>

      <h2>How to request help</h2>
      <p>
        Please use <Link href="/support">/support</Link> to open a ticket. Include your order ID if available.
      </p>

      <p>
        Related: <Link href="/policies/terms">Terms</Link>, <Link href="/policies/shipping">Shipping Policy</Link>.
      </p>
    </div>
  );
}

