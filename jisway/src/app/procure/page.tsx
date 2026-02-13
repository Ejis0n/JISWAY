import type { Metadata } from "next";
import { ProcureFormClient } from "@/components/procure/ProcureFormClient";

export const metadata: Metadata = {
  title: "Procurement Request",
  description: "Submit a procurement request for JIS fasteners.",
};

export default function ProcurePage() {
  return <ProcureFormClient />;
}

