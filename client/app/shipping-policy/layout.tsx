import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description:
    "InvertisPrep's shipping and delivery policy for any physical goods or merchandise associated with events and sponsorships.",
  path: "/shipping-policy",
});

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
