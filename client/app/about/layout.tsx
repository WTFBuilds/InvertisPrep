import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "InvertisPrep is a free student platform for Invertis University — previous year question papers (PYQ), syllabus & resources, an ATS resume builder and more. Built by students, for students.",
  keywords: ["about InvertisPrep", "InvertisPrep team", "Invertis University PYQ platform"],
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
