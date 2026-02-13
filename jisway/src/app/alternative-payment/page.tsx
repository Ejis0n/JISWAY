import { redirect } from "next/navigation";

/**
 * Wire / USDT payment requests use the same quote flow.
 * Redirect so footer link does not 404.
 */
export default function AlternativePaymentPage() {
  redirect("/quote");
}
