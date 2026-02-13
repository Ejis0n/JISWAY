import Link from "next/link";

export const metadata = { title: "Shipping Policy | JISWAY" };

export default function ShippingPolicyPage() {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Shipping Policy</h1>

      <h2>No inventory / processing time</h2>
      <ul>
        <li>JISWAY does not hold local stock. Items are procured after payment confirmation.</li>
        <li>Processing and handling may take time before shipment.</li>
      </ul>

      <h2>Carrier and ETA</h2>
      <ul>
        <li>We select carriers based on destination rules (e.g., Japan Post or DHL).</li>
        <li>Displayed ETA is an estimate and does not include customs delays.</li>
      </ul>

      <h2>Duties, taxes, and customs</h2>
      <ul>
        <li>Import duties and taxes are the responsibility of the recipient.</li>
        <li>Customs delays are not grounds for refunds.</li>
      </ul>

      <h2>Address errors</h2>
      <ul>
        <li>You are responsible for providing an accurate address.</li>
        <li>If a shipment must be re-sent due to address errors, re-shipping costs may be billed to you.</li>
      </ul>

      <h2>Partial shipments</h2>
      <ul>
        <li>We aim to avoid partial shipments. If partial shipment is unavoidable, we will communicate options.</li>
      </ul>

      <h2>Problems (damage / loss)</h2>
      <ul>
        <li>
          Damage: open a ticket within <strong>7 days</strong> of delivery with packaging and item photos.
        </li>
        <li>
          Non-delivery: open a case after <strong>14 business days</strong> past the estimated delivery window.
        </li>
      </ul>

      <p>
        For support, use <Link href="/support">/support</Link>.
      </p>
      <p>
        Related: <Link href="/policies/refund">Refund Policy</Link>.
      </p>
    </div>
  );
}

