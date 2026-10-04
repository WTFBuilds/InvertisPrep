import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Syllabus – Invertis University (All Departments & Semesters)",
  description:
    "Browse and download the Invertis University syllabus for B.Tech, BCA, BBA, MCA and more — course-wise, semester-wise syllabus PDFs for every department, free on InvertisPrep.",
  keywords: [
    "Invertis University syllabus",
    "Invertis syllabus PDF",
    "Invertis University B.Tech syllabus",
    "Invertis University BCA syllabus",
    "Invertis University semester syllabus",
    "InvertisPrep syllabus",
  ],
  path: "/resources/syllabus",
});

export default function SyllabusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
