import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Support & Help Center",
  description:
    "Get help with InvertisPrep — account and login issues, missing PYQ papers, resume builder questions and anything else, from the InvertisPrep support team.",
  keywords: [
    "InvertisPrep support",
    "InvertisPrep help",
    "PYQ paper missing",
    "InvertisPrep help center",
  ],
  path: "/support",
});

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
