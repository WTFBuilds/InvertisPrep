import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cancellation & Refund Policy",
  description:
    "InvertisPrep's cancellation and refund policy — how cancellations, refunds and unauthorized transactions are handled for any paid features.",
  path: "/cancellation-and-refunds",
});

export default function CancellationAndRefundsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
