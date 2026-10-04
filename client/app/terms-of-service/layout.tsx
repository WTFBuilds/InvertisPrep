import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms governing your use of InvertisPrep — the free PYQ papers, study resources and resume builder platform for Invertis University students.",
  path: "/terms-of-service",
});

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
