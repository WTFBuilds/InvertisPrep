import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Previous Year Question Papers (PYQ) – Invertis University",
  description:
    "Browse and download free previous year question papers (PYQ) for Invertis University by department, branch, semester and subject. Mid-term and end-term exam papers for B.Tech, BCA, BBA, MCA and more.",
  keywords: [
    "Invertis University PYQ",
    "Invertis previous year question papers",
    "PYQ papers Invertis University",
    "Invertis University question bank",
    "Invertis University semester exam papers",
    "Invertis University B.Tech question papers",
    "Invertis University BCA question papers",
  ],
  path: "/pyq",
});

export default function PyqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
