import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "My Resumes – Free ATS Resume Builder",
  description:
    "Manage your saved resumes — create, edit and download ATS-friendly resumes built with InvertisPrep's free resume builder.",
  path: "/resumes",
  robotsIndex: false,
});

export default function ResumesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
