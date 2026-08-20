import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the InvertisPrep team. Report missing question papers, suggest improvements or ask about Invertis University PYQ papers and features.",
  keywords: ["contact InvertisPrep", "InvertisPrep support", "report missing PYQ paper"],
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
