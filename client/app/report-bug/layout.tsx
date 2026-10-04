import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Report a Bug",
  description:
    "Found a bug on InvertisPrep? Report it here and help us improve the free PYQ papers, resources and resume builder platform for Invertis University students.",
  keywords: [
    "report bug InvertisPrep",
    "InvertisPrep bug report",
    "InvertisPrep issues",
  ],
  path: "/report-bug",
});

export default function ReportBugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
