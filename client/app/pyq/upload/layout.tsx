import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Upload PYQ Papers – Contribute to InvertisPrep",
  description:
    "Help fellow Invertis University students — upload previous year question papers (PYQ) to InvertisPrep. Every submission is verified by our team and published for free access.",
  keywords: [
    "upload PYQ Invertis",
    "contribute question papers",
    "Invertis University PYQ upload",
    "share previous year papers",
  ],
  path: "/pyq/upload",
});

export default function PyqUploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
