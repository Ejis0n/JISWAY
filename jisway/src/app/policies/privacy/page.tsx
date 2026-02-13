import Link from "next/link";

export const metadata = { title: "Privacy Policy | JISWAY" };

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>This policy explains what we collect and why, in plain terms.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Contact information (email, name/company if provided)</li>
        <li>Shipping destination country (and address details provided to payment providers)</li>
        <li>Order and support ticket details you submit</li>
        <li>Operational logs (e.g., events for reliability and fraud prevention)</li>
      </ul>

      <h2>How we use data</h2>
      <ul>
        <li>To process orders, procurement, shipping, and customer support</li>
        <li>To prevent fraud and resolve disputes (evidence, tracking, communications)</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>Sharing</h2>
      <ul>
        <li>Payment processors (e.g., Stripe) to complete payments</li>
        <li>Carriers and suppliers to procure and deliver items</li>
        <li>Email provider to send transactional messages</li>
      </ul>

      <h2>Data retention</h2>
      <p>We retain order/support records as needed for operations, accounting, and dispute handling.</p>

      <h2>Your choices</h2>
      <ul>
        <li>You can contact support to request correction of incorrect information where applicable.</li>
      </ul>

      <p>
        Related: <Link href="/policies/terms">Terms</Link>.
      </p>
    </div>
  );
}

