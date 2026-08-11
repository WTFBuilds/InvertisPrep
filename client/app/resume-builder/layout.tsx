import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free ATS Resume Builder for Students",
  description:
    "Build a clean, ATS-friendly resume for free with InvertisPrep's resume builder. Live preview, easy section editing and one-click PDF export — perfect for Invertis University students and internships.",
  keywords: [
    "free ATS resume builder",
    "ATS resume builder for students",
    "online resume builder free",
    "resume builder for college students",
    "ATS friendly resume",
    "resume PDF download",
    "InvertisPrep resume builder",
  ],
  path: "/resume-builder",
});

export default function ResumeBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
