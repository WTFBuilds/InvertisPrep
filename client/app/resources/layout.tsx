import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Resources & Syllabus – Invertis University",
  description:
    "Free study resources and syllabus for Invertis University students — previous year question papers, course syllabus and exam preparation materials in one place.",
  keywords: [
    "Invertis University resources",
    "Invertis University syllabus",
    "Invertis University study material",
    "Invertis University exam preparation",
    "InvertisPrep resources",
  ],
  path: "/resources",
});

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
