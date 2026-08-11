import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Our Team",
  description:
    "Meet the students behind InvertisPrep — the free PYQ question paper and resume builder platform for Invertis University.",
  keywords: ["InvertisPrep team", "InvertisPrep founders", "InvertisPrep creators"],
  path: "/our-team",
});

export default function OurTeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
